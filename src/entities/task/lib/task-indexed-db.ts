import { z } from 'zod'

import { taskCollectionSchema, type Task } from '@/entities/task/model/task'

const databaseName = 'forma-workspace'
const databaseVersion = 1
const taskStoreName = 'project-tasks'

const projectTaskRecordSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  updatedAt: z.string(),
})

interface ProjectTaskRecord {
  projectId: string
  tasks: Task[]
  updatedAt: string
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
    if (!recordResult.data.tasks.every((task) => task.projectId === projectId)) {
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

  const parsed = taskCollectionSchema.parse(tasks)
  if (!parsed.every((task) => task.projectId === projectId)) {
    throw new Error('Task collection does not match project')
  }

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

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(taskStoreName)) {
        database.createObjectStore(taskStoreName, { keyPath: 'projectId' })
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
