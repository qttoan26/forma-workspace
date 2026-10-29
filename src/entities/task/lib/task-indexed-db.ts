import { z } from 'zod'

import { taskCollectionSchema, type Task } from '@/entities/task/model/task'

const databaseName = 'forma-workspace'
const databaseVersion = 2
const taskStoreName = 'project-tasks'
const taskSyncQueueStoreName = 'task-sync-queue'

const projectTaskRecordSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  updatedAt: z.string(),
})

const queuedProjectTaskSyncSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  mutationId: z.string().min(1),
  queuedAt: z.string(),
})

interface ProjectTaskRecord {
  projectId: string
  tasks: Task[]
  updatedAt: string
}

export interface QueuedProjectTaskSync {
  projectId: string
  tasks: Task[]
  mutationId: string
  queuedAt: string
}

export async function loadProjectTasksFromIndexedDb(
  projectId: string,
): Promise<Task[] | null> {
  if (!('indexedDB' in globalThis)) return null

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

    return recordResult.data.tasks
  } finally {
    database.close()
  }
}

export async function saveProjectTasksToIndexedDb(
  projectId: string,
  tasks: Task[],
): Promise<void> {
  if (!('indexedDB' in globalThis)) {
    throw new Error('IndexedDB is unavailable')
  }

  const parsed = parseProjectTasks(projectId, tasks)
  const database = await openDatabase()
  try {
    const transaction = database.transaction(taskStoreName, 'readwrite')
    transaction.objectStore(taskStoreName).put({
      projectId,
      tasks: parsed,
      updatedAt: new Date().toISOString(),
    } satisfies ProjectTaskRecord)
    await transactionToPromise(transaction)
  } finally {
    database.close()
  }
}

export async function enqueueProjectTaskSync(
  projectId: string,
  tasks: Task[],
): Promise<QueuedProjectTaskSync> {
  if (!('indexedDB' in globalThis)) {
    throw new Error('IndexedDB is unavailable')
  }

  const queuedSync: QueuedProjectTaskSync = {
    projectId,
    tasks: parseProjectTasks(projectId, tasks),
    mutationId: createMutationId(),
    queuedAt: new Date().toISOString(),
  }
  const database = await openDatabase()
  try {
    const transaction = database.transaction(taskSyncQueueStoreName, 'readwrite')
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
  if (!('indexedDB' in globalThis)) return null

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
  if (!('indexedDB' in globalThis)) return false

  const database = await openDatabase()
  try {
    return await completeQueuedSync(database, projectId, mutationId)
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

function completeQueuedSync(
  database: IDBDatabase,
  projectId: string,
  mutationId: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(taskSyncQueueStoreName, 'readwrite')
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
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to read task sync queue'))
    transaction.oncomplete = () => resolve(completed)
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Failed to update task sync queue'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Task sync queue update aborted'))
  })
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

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
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}
