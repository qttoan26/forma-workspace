import { z } from 'zod'

import {
  taskActivityCollectionSchema,
  taskActivityEntrySchema,
  type TaskActivityEntry,
} from '@/entities/task/model/task-activity'
import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

const databaseName = 'forma-workspace'
const databaseVersion = 3
const taskStoreName = 'project-tasks'
const taskSyncQueueStoreName = 'task-sync-queue'
const taskActivityStoreName = 'task-activity'

const projectTaskRecordSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  revision: z.number().int().nonnegative().default(0),
  updatedAt: z.string(),
})

const queuedProjectTaskSyncSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  mutationId: z.string().min(1),
  queuedAt: z.string(),
  expectedRevision: z.number().int().nonnegative().optional(),
})

const taskActivityRecordSchema = z.object({
  scopeKey: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  entries: taskActivityCollectionSchema,
  updatedAt: z.string(),
})

export interface ProjectTaskSnapshot {
  projectId: string
  tasks: Task[]
  revision: number
  updatedAt: string
}

export interface QueuedProjectTaskSync {
  projectId: string
  tasks: Task[]
  mutationId: string
  queuedAt: string
  expectedRevision?: number | undefined
}

export async function loadProjectTaskSnapshotFromIndexedDb(
  projectId: string,
): Promise<ProjectTaskSnapshot | null> {
  if (!hasIndexedDb()) return null

  const database = await openDatabase()
  try {
    const objectStore = database
      .transaction(taskStoreName, 'readonly')
      .objectStore(taskStoreName)
    const request = objectStore.get(projectId) as IDBRequest<unknown>
    const rawRecord = await requestToPromise(request)
    const recordResult = projectTaskRecordSchema.safeParse(rawRecord)

    if (!recordResult.success) return null
    if (recordResult.data.projectId !== projectId) return null
    if (
      !recordResult.data.tasks.every((task) => task.projectId === projectId)
    ) {
      return null
    }

    return recordResult.data
  } finally {
    database.close()
  }
}

export async function loadProjectTasksFromIndexedDb(
  projectId: string,
): Promise<Task[] | null> {
  const snapshot = await loadProjectTaskSnapshotFromIndexedDb(projectId)
  return snapshot?.tasks ?? null
}

export async function saveProjectTasksToIndexedDb(
  projectId: string,
  tasks: Task[],
): Promise<ProjectTaskSnapshot> {
  if (!hasIndexedDb()) {
    throw new Error('IndexedDB is unavailable')
  }

  const parsed = parseProjectTasks(projectId, tasks)
  const database = await openDatabase()
  try {
    return await saveProjectTaskSnapshot(database, projectId, parsed)
  } finally {
    database.close()
  }
}

export async function enqueueProjectTaskSync(
  projectId: string,
  tasks: Task[],
  expectedRevision?: number,
): Promise<QueuedProjectTaskSync> {
  if (!hasIndexedDb()) {
    throw new Error('IndexedDB is unavailable')
  }

  const queuedSync: QueuedProjectTaskSync = {
    projectId,
    tasks: parseProjectTasks(projectId, tasks),
    mutationId: createMutationId(),
    queuedAt: new Date().toISOString(),
    ...(expectedRevision === undefined ? {} : { expectedRevision }),
  }
  const database = await openDatabase()
  try {
    const transaction = database.transaction(
      taskSyncQueueStoreName,
      'readwrite',
    )
    transaction.objectStore(taskSyncQueueStoreName).put(queuedSync)
    await transactionToPromise(transaction)
    return queuedSync
  } finally {
    database.close()
  }
}

export async function loadQueuedProjectTaskSync(
  projectId: string,
): Promise<QueuedProjectTaskSync | null> {
  if (!hasIndexedDb()) return null

  const database = await openDatabase()
  try {
    const objectStore = database
      .transaction(taskSyncQueueStoreName, 'readonly')
      .objectStore(taskSyncQueueStoreName)
    const request = objectStore.get(projectId) as IDBRequest<unknown>
    const rawRecord = await requestToPromise(request)
    const result = queuedProjectTaskSyncSchema.safeParse(rawRecord)

    if (!result.success || result.data.projectId !== projectId) return null
    return result.data
  } finally {
    database.close()
  }
}

export async function completeProjectTaskSync(
  projectId: string,
  mutationId: string,
): Promise<boolean> {
  if (!hasIndexedDb()) return false

  const database = await openDatabase()
  try {
    return await completeQueuedSync(database, projectId, mutationId)
  } finally {
    database.close()
  }
}

export async function loadTaskActivityFromIndexedDb(
  projectId: string,
  taskId: string,
): Promise<TaskActivityEntry[]> {
  if (!hasIndexedDb()) return []

  const database = await openDatabase()
  try {
    const objectStore = database
      .transaction(taskActivityStoreName, 'readonly')
      .objectStore(taskActivityStoreName)
    const request = objectStore.get(
      createTaskActivityScopeKey(projectId, taskId),
    ) as IDBRequest<unknown>
    const rawRecord = await requestToPromise(request)
    const result = taskActivityRecordSchema.safeParse(rawRecord)

    if (!result.success) return []
    if (result.data.projectId !== projectId || result.data.taskId !== taskId) {
      return []
    }

    return result.data.entries
  } finally {
    database.close()
  }
}

export async function appendTaskActivityToIndexedDb(
  projectId: string,
  taskId: string,
  entry: TaskActivityEntry,
): Promise<TaskActivityEntry[]> {
  if (!hasIndexedDb()) {
    throw new Error('IndexedDB is unavailable')
  }

  const parsedEntry = taskActivityEntrySchema.parse(entry)
  if (parsedEntry.projectId !== projectId || parsedEntry.taskId !== taskId) {
    throw new Error('Task activity entry does not match task scope')
  }

  const currentEntries = await loadTaskActivityFromIndexedDb(projectId, taskId)
  const entries = taskActivityCollectionSchema.parse([
    ...currentEntries,
    parsedEntry,
  ])
  const database = await openDatabase()
  try {
    const transaction = database.transaction(taskActivityStoreName, 'readwrite')
    transaction.objectStore(taskActivityStoreName).put({
      scopeKey: createTaskActivityScopeKey(projectId, taskId),
      projectId,
      taskId,
      entries,
      updatedAt: new Date().toISOString(),
    })
    await transactionToPromise(transaction)
    return entries
  } finally {
    database.close()
  }
}

function parseProjectTasks(projectId: string, tasks: Task[]) {
  const parsed = taskCollectionSchema.parse(tasks)
  if (!parsed.every((task) => task.projectId === projectId)) {
    throw new Error('Task collection does not match project')
  }
  return parsed
}

function saveProjectTaskSnapshot(
  database: IDBDatabase,
  projectId: string,
  tasks: Task[],
): Promise<ProjectTaskSnapshot> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(taskStoreName, 'readwrite')
    const objectStore = transaction.objectStore(taskStoreName)
    const request = objectStore.get(projectId) as IDBRequest<unknown>
    let snapshot: ProjectTaskSnapshot | null = null

    request.onsuccess = () => {
      const current = projectTaskRecordSchema.safeParse(request.result)
      const revision = current.success ? current.data.revision + 1 : 1

      snapshot = {
        projectId,
        tasks,
        revision,
        updatedAt: new Date().toISOString(),
      }
      objectStore.put(snapshot)
    }
    request.onerror = () => {
      const error =
        request.error ?? new Error('Failed to read project task snapshot')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
    transaction.oncomplete = () => {
      if (!snapshot) {
        const error = new Error('Project task snapshot was not written')
        reportBrowserStorageFailure('indexed-db', error)
        reject(error)
        return
      }
      reportBrowserStorageSuccess('indexed-db')
      resolve(snapshot)
    }
    transaction.onerror = () => {
      const error =
        transaction.error ?? new Error('Failed to save project tasks')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
    transaction.onabort = () => {
      const error = transaction.error ?? new Error('Project task save aborted')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
  })
}

function completeQueuedSync(
  database: IDBDatabase,
  projectId: string,
  mutationId: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      taskSyncQueueStoreName,
      'readwrite',
    )
    const objectStore = transaction.objectStore(taskSyncQueueStoreName)
    const request = objectStore.get(projectId) as IDBRequest<unknown>
    let completed = false

    request.onsuccess = () => {
      const result = queuedProjectTaskSyncSchema.safeParse(request.result)
      if (result.success && result.data.mutationId === mutationId) {
        objectStore.delete(projectId)
        completed = true
      }
    }
    request.onerror = () => {
      const error = request.error ?? new Error('Failed to read task sync queue')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
    transaction.oncomplete = () => {
      reportBrowserStorageSuccess('indexed-db')
      resolve(completed)
    }
    transaction.onerror = () => {
      const error =
        transaction.error ?? new Error('Failed to update task sync queue')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
    transaction.onabort = () => {
      const error =
        transaction.error ?? new Error('Task sync queue update aborted')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
  })
}

function createTaskActivityScopeKey(projectId: string, taskId: string) {
  return `${projectId}:${taskId}`
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function hasIndexedDb() {
  try {
    if (!('indexedDB' in globalThis) || !globalThis.indexedDB) {
      reportBrowserStorageFailure(
        'indexed-db',
        new DOMException('IndexedDB is unavailable', 'NotSupportedError'),
      )
      return false
    }
    return true
  } catch (error) {
    reportBrowserStorageFailure('indexed-db', error)
    return false
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = globalThis.indexedDB.open(databaseName, databaseVersion)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(taskStoreName)) {
          database.createObjectStore(taskStoreName, { keyPath: 'projectId' })
        }
        if (!database.objectStoreNames.contains(taskSyncQueueStoreName)) {
          database.createObjectStore(taskSyncQueueStoreName, {
            keyPath: 'projectId',
          })
        }
        if (!database.objectStoreNames.contains(taskActivityStoreName)) {
          database.createObjectStore(taskActivityStoreName, {
            keyPath: 'scopeKey',
          })
        }
      }
      request.onsuccess = () => {
        reportBrowserStorageSuccess('indexed-db')
        resolve(request.result)
      }
      request.onerror = () => {
        const error = request.error ?? new Error('Failed to open IndexedDB')
        reportBrowserStorageFailure('indexed-db', error)
        reject(error)
      }
    } catch (error) {
      reportBrowserStorageFailure('indexed-db', error)
      reject(toError(error))
    }
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      reportBrowserStorageSuccess('indexed-db')
      resolve(request.result)
    }
    request.onerror = () => {
      const error = request.error ?? new Error('IndexedDB request failed')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
  })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      reportBrowserStorageSuccess('indexed-db')
      resolve()
    }
    transaction.onerror = () => {
      const error =
        transaction.error ?? new Error('IndexedDB transaction failed')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
    transaction.onabort = () => {
      const error =
        transaction.error ?? new Error('IndexedDB transaction aborted')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
  })
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}
