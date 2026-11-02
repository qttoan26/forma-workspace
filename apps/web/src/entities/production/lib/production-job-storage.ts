import {
  productionJobCollectionSchema,
  productionJobInputSchema,
  productionJobSchema,
  assertProductionSources,
  type ProductionJob,
  type ProductionJobInput,
  type ProductionSourceContext,
} from '../model/production-job'
import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

const changeEvent = 'forma:production-jobs-change'
const keyFor = (projectId: string) =>
  `forma-workspace:production-jobs:v1:${projectId}`
const cache = new Map<string, { raw: string | null; jobs: ProductionJob[] }>()

export function readProductionJobs(projectId: string): ProductionJob[] {
  try {
    const raw = localStorage.getItem(keyFor(projectId))
    const previous = cache.get(projectId)
    if (previous && previous.raw === raw) return previous.jobs
    const jobs = productionJobCollectionSchema.parse(
      raw === null ? [] : JSON.parse(raw),
    )
    if (jobs.some((job) => job.projectId !== projectId))
      throw new Error('Saved packages do not match this project.')
    cache.set(projectId, { raw, jobs })
    reportBrowserStorageSuccess('local-storage')
    return jobs
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    throw error
  }
}

export class ProductionJobConflict extends Error {
  constructor() {
    super(
      'This package changed in another view. Close the editor and reopen the latest package.',
    )
  }
}
type Expected = Pick<ProductionJob, 'id' | 'revision'>
type JobMutation =
  | { kind: 'create'; input: ProductionJobInput }
  | { kind: 'update'; expected: Expected; input: ProductionJobInput }
  | { kind: 'status'; expected: Expected; status: ProductionJob['status'] }
  | { kind: 'remove'; expected: Expected }

export async function mutateProductionJob(
  projectId: string,
  mutation: JobMutation,
  getSources: () => Promise<ProductionSourceContext>,
): Promise<ProductionJob | null> {
  async function commit() {
    // Load sources inside the lock before the final collection read. Another
    // browser tab cannot replace this collection with a stale panel snapshot.
    const needsSources =
      mutation.kind === 'create' ||
      mutation.kind === 'update' ||
      (mutation.kind === 'status' && mutation.status === 'queued')
    const context = needsSources ? await getSources() : null
    const current = readProductionJobs(projectId)
    const now = new Date().toISOString()
    let result: ProductionJob | null
    let next: ProductionJob[]
    if (mutation.kind === 'create') {
      const input = productionJobInputSchema.parse(mutation.input)
      if (!context) throw new Error('Source context is unavailable.')
      assertProductionSources(projectId, input, context)
      result = productionJobSchema.parse({
        ...input,
        id:
          globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        projectId,
        status: 'draft',
        revision: 0,
        createdAt: now,
        updatedAt: now,
      })
      next = [...current, result]
    } else {
      const existing = current.find((job) => job.id === mutation.expected.id)
      if (!existing || existing.revision !== mutation.expected.revision)
        throw new ProductionJobConflict()
      if (mutation.kind === 'remove') {
        result = null
        next = current.filter((job) => job.id !== existing.id)
      } else {
        const input =
          mutation.kind === 'update'
            ? productionJobInputSchema.parse(mutation.input)
            : existing
        if (needsSources) {
          if (!context) throw new Error('Source context is unavailable.')
          assertProductionSources(projectId, input, context)
        }
        result = productionJobSchema.parse({
          ...existing,
          ...input,
          ownerId: input.ownerId,
          dueDate: input.dueDate,
          status:
            mutation.kind === 'status' ? mutation.status : existing.status,
          revision: existing.revision + 1,
          updatedAt: now,
        })
        next = current.map((job) => (job.id === existing.id ? result! : job))
      }
    }
    const parsed = productionJobCollectionSchema.parse(next)
    try {
      localStorage.setItem(keyFor(projectId), JSON.stringify(parsed))
      reportBrowserStorageSuccess('local-storage')
      refreshProductionJobs(projectId)
    } catch (error) {
      reportBrowserStorageFailure('local-storage', error)
      throw error
    }
    return result
  }
  if (navigator.locks) return navigator.locks.request(keyFor(projectId), commit)
  // Same-tab serialization also covers browsers without Web Locks. Atomic
  // cross-tab writes on those browsers require a future shared repository.
  const previous = pending.get(projectId) ?? Promise.resolve()
  const operation = previous.catch(() => undefined).then(commit)
  pending.set(projectId, operation)
  try {
    return await operation
  } finally {
    if (pending.get(projectId) === operation) pending.delete(projectId)
  }
}
const pending = new Map<string, Promise<unknown>>()

export function refreshProductionJobs(projectId: string) {
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: { projectId } }))
}
export function subscribeProductionJobs(
  projectId: string,
  onChange: () => void,
) {
  const local = (event: Event) => {
    if (
      (event as CustomEvent<{ projectId?: string }>).detail?.projectId ===
      projectId
    )
      onChange()
  }
  const storage = (event: StorageEvent) => {
    if (event.key === null || event.key === keyFor(projectId)) onChange()
  }
  window.addEventListener(changeEvent, local)
  window.addEventListener('storage', storage)
  window.addEventListener('focus', onChange)
  return () => {
    window.removeEventListener(changeEvent, local)
    window.removeEventListener('storage', storage)
    window.removeEventListener('focus', onChange)
  }
}
