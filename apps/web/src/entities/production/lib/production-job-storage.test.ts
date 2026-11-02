import { vi } from 'vitest'
import {
  mutateProductionJob,
  ProductionJobConflict,
  readProductionJobs,
  subscribeProductionJobs,
} from './production-job-storage'
import {
  productionJobInputSchema,
  type ProductionJobInput,
  type ProductionSourceContext,
} from '../model/production-job'

const projectId = 'production-test'
const key = `forma-workspace:production-jobs:v1:${projectId}`
const input: ProductionJobInput = {
  name: 'Prepare source batch',
  requirements: 'Review source quality',
  workType: 'scan',
  taskIds: ['TASK-1'],
  documentReferenceIds: ['doc-1'],
  priority: 'high',
  ownerId: 'member-1',
}
const context: ProductionSourceContext = {
  projectId,
  tasks: [{ id: 'TASK-1', projectId }],
  documents: [{ id: 'doc-1', projectId }],
  members: [{ id: 'member-1' }],
}
const getSources = () => Promise.resolve(context)
beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('creates drafts and persists explicit queue and return-to-draft transitions without changing source data', async () => {
  const job = (await mutateProductionJob(
    projectId,
    { kind: 'create', input },
    getSources,
  ))!
  expect(job.status).toBe('draft')
  const queued = (await mutateProductionJob(
    projectId,
    { kind: 'status', expected: job, status: 'queued' },
    getSources,
  ))!
  expect(queued).toMatchObject({
    id: job.id,
    status: 'queued',
    revision: 1,
    createdAt: job.createdAt,
  })
  const draft = await mutateProductionJob(
    projectId,
    { kind: 'status', expected: queued, status: 'draft' },
    getSources,
  )
  expect(draft).toMatchObject({ status: 'draft', revision: 2 })
  expect(context.tasks).toEqual([{ id: 'TASK-1', projectId }])
})

it('preserves concurrent new packages and rejects stale edits, transitions and removals', async () => {
  const [first, second] = await Promise.all([
    mutateProductionJob(projectId, { kind: 'create', input }, getSources),
    mutateProductionJob(
      projectId,
      { kind: 'create', input: { ...input, name: 'Other batch' } },
      getSources,
    ),
  ])
  expect(readProductionJobs(projectId)).toHaveLength(2)
  await mutateProductionJob(
    projectId,
    {
      kind: 'update',
      expected: first!,
      input: { ...input, name: 'Updated batch' },
    },
    getSources,
  )
  for (const mutation of [
    { kind: 'remove' as const, expected: first! },
    { kind: 'status' as const, expected: first!, status: 'queued' as const },
    { kind: 'update' as const, expected: first!, input },
  ])
    await expect(
      mutateProductionJob(projectId, mutation, getSources),
    ).rejects.toBeInstanceOf(ProductionJobConflict)
  await mutateProductionJob(
    projectId,
    { kind: 'remove', expected: second! },
    getSources,
  )
  expect(readProductionJobs(projectId).map((job) => job.name)).toEqual([
    'Updated batch',
  ])
})

it('blocks missing tasks, documents, owners and foreign project contexts', async () => {
  for (const broken of [
    { ...context, tasks: [] },
    { ...context, documents: [] },
    { ...context, members: [] },
    { ...context, projectId: 'another-project' },
    { ...context, tasks: [{ id: 'TASK-1', projectId: 'another-project' }] },
  ])
    await expect(
      mutateProductionJob(projectId, { kind: 'create', input }, () =>
        Promise.resolve(broken),
      ),
    ).rejects.toThrow()
  expect(readProductionJobs(projectId)).toEqual([])
})

it('rechecks sources before queuing and allows returning an orphaned package to draft', async () => {
  const job = (await mutateProductionJob(
    projectId,
    { kind: 'create', input },
    getSources,
  ))!
  await expect(
    mutateProductionJob(
      projectId,
      { kind: 'status', expected: job, status: 'queued' },
      () => Promise.resolve({ ...context, documents: [] }),
    ),
  ).rejects.toThrow('unavailable')
  const queued = (await mutateProductionJob(
    projectId,
    { kind: 'status', expected: job, status: 'queued' },
    getSources,
  ))!
  const sourceFailure = vi
    .fn()
    .mockRejectedValue(new Error('sources unavailable'))
  expect(
    await mutateProductionJob(
      projectId,
      { kind: 'status', expected: queued, status: 'draft' },
      sourceFailure,
    ),
  ).toMatchObject({ status: 'draft' })
  expect(sourceFailure).not.toHaveBeenCalled()
})

it('does not overwrite unreadable, duplicate or incorrectly scoped stored packages', async () => {
  const job = (await mutateProductionJob(
    projectId,
    { kind: 'create', input },
    getSources,
  ))!
  for (const raw of [
    '{invalid',
    JSON.stringify([job, job]),
    JSON.stringify([{ ...job, projectId: 'foreign' }]),
  ]) {
    localStorage.setItem(key, raw)
    expect(() => readProductionJobs(projectId)).toThrow()
    await expect(
      mutateProductionJob(projectId, { kind: 'create', input }, getSources),
    ).rejects.toThrow()
    expect(localStorage.getItem(key)).toBe(raw)
  }
})

it('announces no successful change when the browser write fails', async () => {
  const changed = vi.fn()
  const unsubscribe = subscribeProductionJobs(projectId, changed)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  await expect(
    mutateProductionJob(projectId, { kind: 'create', input }, getSources),
  ).rejects.toThrow()
  expect(changed).not.toHaveBeenCalled()
  expect(readProductionJobs(projectId)).toEqual([])
  unsubscribe()
})

it('requires task sources and rejects duplicate references', () => {
  expect(
    productionJobInputSchema.safeParse({ ...input, taskIds: [] }).success,
  ).toBe(false)
  expect(
    productionJobInputSchema.safeParse({
      ...input,
      taskIds: ['TASK-1', 'TASK-1'],
    }).success,
  ).toBe(false)
  expect(
    productionJobInputSchema.safeParse({ ...input, dueDate: 'not-a-date' })
      .success,
  ).toBe(false)
})

it('clears owner and due date when the edited plan omits them', async () => {
  const job = (await mutateProductionJob(
    projectId,
    { kind: 'create', input: { ...input, dueDate: '2026-11-15' } },
    getSources,
  ))!
  const cleared = { ...input, ownerId: undefined, dueDate: undefined }
  await mutateProductionJob(
    projectId,
    { kind: 'update', expected: job, input: cleared },
    getSources,
  )
  expect(readProductionJobs(projectId)[0]?.ownerId).toBeUndefined()
  expect(readProductionJobs(projectId)[0]?.dueDate).toBeUndefined()
})

it('saves distinct packages when randomUUID is unavailable in a preview browser', async () => {
  vi.stubGlobal('crypto', {})
  const first = await mutateProductionJob(
    projectId,
    { kind: 'create', input },
    getSources,
  )
  const second = await mutateProductionJob(
    projectId,
    { kind: 'create', input },
    getSources,
  )
  expect(first?.id).not.toBe(second?.id)
  expect(readProductionJobs(projectId)).toHaveLength(2)
})
