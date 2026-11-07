import { z } from 'zod'
import { projectSchema, type Project } from '../model/project'
import {
  projectCreateSchema,
  type ProjectCreateValues,
} from '../model/project-create'

export interface ProjectCatalogScope {
  accountId: string
  workspaceId: string
}

const recordSchema = z.object({
  recordId: z.string(),
  scope: z.string(),
  project: projectSchema,
})
const databaseName = 'forma-project-catalog'
const storeName = 'projects'
const changeEvent = 'forma:project-catalog-changed'
const channelName = 'forma-project-catalog-v1'

function scopeId(scope: ProjectCatalogScope) {
  if (!scope.accountId.trim() || !scope.workspaceId.trim())
    throw new Error('Project catalog scope is missing.')
  return JSON.stringify([
    import.meta.env.BASE_URL,
    scope.workspaceId,
    scope.accountId,
  ])
}

export async function readLocalProjects(
  scope: ProjectCatalogScope,
): Promise<Project[]> {
  const key = scopeId(scope)
  const database = await openDatabase()
  try {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction
      .objectStore(storeName)
      .index('scope')
      .getAll(key) as IDBRequest<unknown[]>
    return await new Promise((resolve, reject) => {
      let projects: Project[] = []
      request.onsuccess = () => {
        try {
          projects = request.result.map((value) => {
            const record = recordSchema.parse(value)
            if (
              record.scope !== key ||
              record.project.workspaceId !== scope.workspaceId ||
              record.recordId !== JSON.stringify([key, record.project.id])
            )
              throw new Error('Project catalog contains an invalid scope.')
            return record.project
          })
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error('Project catalog could not be read.'),
          )
        }
      }
      transaction.oncomplete = () => resolve(projects)
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error('Project catalog could not be read.'),
        )
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error('Project catalog read was interrupted.'),
        )
    })
  } finally {
    database.close()
  }
}

export async function createLocalProject(
  scope: ProjectCatalogScope,
  values: ProjectCreateValues,
  reservedKeys: string[],
): Promise<Project> {
  const key = scopeId(scope)
  const parsed = projectCreateSchema.parse(values)
  if (reservedKeys.includes(parsed.key))
    throw new Error('A project with this key already exists.')
  const project: Project = {
    ...parsed,
    id: `project-${crypto.randomUUID()}`,
    workspaceId: scope.workspaceId,
  }
  const database = await openDatabase()
  try {
    const transaction = database.transaction(storeName, 'readwrite')
    const write = transaction
      .objectStore(storeName)
      .add({ recordId: JSON.stringify([key, project.id]), scope: key, project })
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () =>
        reject(
          (write.error ?? transaction.error)?.name === 'ConstraintError'
            ? new Error('A project with this key already exists.')
            : (transaction.error ?? new Error('Project could not be saved.')),
        )
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Project save was interrupted.'))
    })
  } finally {
    database.close()
  }
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: key }))
  const channel = openChannel()
  channel?.postMessage(key)
  channel?.close()
  return project
}

export function subscribeProjectCatalog(
  scope: ProjectCatalogScope,
  onChange: () => void,
) {
  const key = scopeId(scope)
  const channel = openChannel()
  const onLocal = (event: Event) => {
    if ((event as CustomEvent<unknown>).detail === key) onChange()
  }
  if (channel)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === key) onChange()
    }
  window.addEventListener(changeEvent, onLocal)
  window.addEventListener('focus', onChange)
  return () => {
    channel?.close()
    window.removeEventListener(changeEvent, onLocal)
    window.removeEventListener('focus', onChange)
  }
}

function openChannel() {
  try {
    return typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel(channelName)
  } catch {
    return null
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('Allow browser storage to load and save projects.'))
      return
    }
    const request = indexedDB.open(databaseName, 1)
    let blocked = false
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(storeName, {
        keyPath: 'recordId',
      })
      store.createIndex('scope', 'scope')
      store.createIndex('scope-key', ['scope', 'project.key'], { unique: true })
    }
    request.onblocked = () => {
      blocked = true
      reject(
        new Error('Close other Forma tabs and try loading projects again.'),
      )
    }
    request.onerror = () =>
      reject(request.error ?? new Error('Project storage is unavailable.'))
    request.onsuccess = () => {
      if (blocked) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
  })
}
