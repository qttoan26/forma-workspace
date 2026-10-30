import { z } from 'zod'

import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import { getFrontendAuthStorageScope } from '@/shared/lib/auth-session'
import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

const databaseName = 'forma-workspace'
const databaseVersion = 3
const taskStoreName = 'project-tasks-scoped'
const taskSyncQueueStoreName = 'task-sync-queue-scoped'
const legacyTaskStoreName = 'project-tasks'
const legacyTaskSyncQueueStoreName = 'task-sync-queue'
const localDevelopmentStorageScope = 'local-development-user'

const projectTaskRecordSchema = z.object({
  storageId: z.string().min(1),
  authScope: z.string().min(1),
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  revision: z.number().int().nonnegative().default(0),
  updatedAt: z.string(),
})

const legacyProjectTaskRecordSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  revision: z.number().int().nonnegative().default(0),
  updatedAt: z.string(),
})

const queuedProjectTaskSyncSchema = z.object({
  storageId: z.string().min(1),
  authScope: z.string().min(1),
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  mutationId: z.string().min(1),
  queuedAt: z.string(),
  expectedRevision: z.number().int().nonnegative().optional(),
})

const legacyQueuedProjectTaskSyncSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  mutationId: z.string().min(1),
  queuedAt: z.string(),
  expectedRevision: z.number().int().nonnegative().optional(),
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

interface ScopedProjectTaskSnapshot extends ProjectTaskSnapshot {
  storageId: string
  authScope: string
}

interface ScopedQueuedProjectTaskSync extends QueuedProjectTaskSync {
  storageId: string
  authScope: string
}

export async function loadProjectTaskSnapshotFromIndexedDb(
  projectId: string,
): Promise<ProjectTaskSnapshot | null> {
  if (!hasIndexedDb()) return null

  const database = await openDatabase()
  try {
    const authScope = getFrontendAuthStorageScope()
    const storageId = createStorageId(authScope, projectId)
    const rawRecord = await readStoreValue(database, taskStoreName, storageId)
    const record = parseScopedProjectTaskSnapshot(
      rawRecord,
      authScope,
      projectId,
      storageId,
    )
    if (record) return toProjectTaskSnapshot(record)

    if (authScope !== localDevelopmentStorageScope) return null
    return migrateLegacyProjectTaskSnapshot(database, projectId, storageId)
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

  const authScope = getFrontendAuthStorageScope()
  const queuedSync: ScopedQueuedProjectTaskSync = {
    storageId: createStorageId(authScope, projectId),
    authScope,
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
    return toQueuedProjectTaskSync(queuedSync)
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
    const authScope = getFrontendAuthStorageScope()
    const storageId = createStorageId(authScope, projectId)
    const rawRecord = await readStoreValue(
      database,
      taskSyncQueueStoreName,
      storageId,
    )
    const queuedSync = parseScopedQueuedSync(
      rawRecord,
      authScope,
      projectId,
      storageId,
    )
    if (queuedSync) return toQueuedProjectTaskSync(queuedSync)

    if (authScope !== localDevelopmentStorageScope) return null
    return migrateLegacyQueuedSync(database, projectId, storageId)
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
    const authScope = getFrontendAuthStorageScope()
    const storageId = createStorageId(authScope, projectId)
    const transaction = database.transaction(taskStoreName, 'readwrite')
    const objectStore = transaction.objectStore(taskStoreName)
    const request = objectStore.get(storageId) as IDBRequest<unknown>
    let snapshot: ScopedProjectTaskSnapshot | null = null

    request.onsuccess = () => {
      const current = parseScopedProjectTaskSnapshot(
        request.result,
        authScope,
        projectId,
        storageId,
      )
      const revision = current ? current.revision + 1 : 1

      snapshot = {
        storageId,
        authScope,
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
      resolve(toProjectTaskSnapshot(snapshot))
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
    const authScope = getFrontendAuthStorageScope()
    const storageId = createStorageId(authScope, projectId)
    const transaction = database.transaction(
      taskSyncQueueStoreName,
      'readwrite',
    )
    const objectStore = transaction.objectStore(taskSyncQueueStoreName)
    const request = objectStore.get(storageId) as IDBRequest<unknown>
    let completed = false

    request.onsuccess = () => {
      const result = parseScopedQueuedSync(
        request.result,
        authScope,
        projectId,
        storageId,
      )
      if (result?.mutationId === mutationId) {
        objectStore.delete(storageId)
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

async function migrateLegacyProjectTaskSnapshot(
  database: IDBDatabase,
  projectId: string,
  storageId: string,
): Promise<ProjectTaskSnapshot | null> {
  if (!database.objectStoreNames.contains(legacyTaskStoreName)) return null

  const rawRecord = await readStoreValue(
    database,
    legacyTaskStoreName,
    projectId,
  )
  const legacy = legacyProjectTaskRecordSchema.safeParse(rawRecord)
  if (!legacy.success) return null
  if (!legacy.data.tasks.every((task) => task.projectId === projectId)) {
    return null
  }

  const scoped: ScopedProjectTaskSnapshot = {
    storageId,
    authScope: localDevelopmentStorageScope,
    ...legacy.data,
  }
  await writeStoreValue(database, taskStoreName, scoped)
  await deleteStoreValue(database, legacyTaskStoreName, projectId).catch(
    () => undefined,
  )
  return toProjectTaskSnapshot(scoped)
}

async function migrateLegacyQueuedSync(
  database: IDBDatabase,
  projectId: string,
  storageId: string,
): Promise<QueuedProjectTaskSync | null> {
  if (!database.objectStoreNames.contains(legacyTaskSyncQueueStoreName)) {
    return null
  }

  const rawRecord = await readStoreValue(
    database,
    legacyTaskSyncQueueStoreName,
    projectId,
  )
  const legacy = legacyQueuedProjectTaskSyncSchema.safeParse(rawRecord)
  if (!legacy.success) return null
  if (!legacy.data.tasks.every((task) => task.projectId === projectId)) {
    return null
  }

  const scoped: ScopedQueuedProjectTaskSync = {
    storageId,
    authScope: localDevelopmentStorageScope,
    ...legacy.data,
  }
  await writeStoreValue(database, taskSyncQueueStoreName, scoped)
  await deleteStoreValue(
    database,
    legacyTaskSyncQueueStoreName,
    projectId,
  ).catch(() => undefined)
  return toQueuedProjectTaskSync(scoped)
}

function parseScopedProjectTaskSnapshot(
  value: unknown,
  authScope: string,
  projectId: string,
  storageId: string,
): ScopedProjectTaskSnapshot | null {
  const result = projectTaskRecordSchema.safeParse(value)
  if (!result.success) return null
  if (
    result.data.authScope !== authScope ||
    result.data.projectId !== projectId ||
    result.data.storageId !== storageId
  ) {
    return null
  }
  if (!result.data.tasks.every((task) => task.projectId === projectId)) {
    return null
  }
  return result.data
}

function parseScopedQueuedSync(
  value: unknown,
  authScope: string,
  projectId: string,
  storageId: string,
): ScopedQueuedProjectTaskSync | null {
  const result = queuedProjectTaskSyncSchema.safeParse(value)
  if (!result.success) return null
  if (
    result.data.authScope !== authScope ||
    result.data.projectId !== projectId ||
    result.data.storageId !== storageId
  ) {
    return null
  }
  if (!result.data.tasks.every((task) => task.projectId === projectId)) {
    return null
  }
  return result.data
}

function toProjectTaskSnapshot(
  snapshot: ScopedProjectTaskSnapshot,
): ProjectTaskSnapshot {
  return {
    projectId: snapshot.projectId,
    tasks: snapshot.tasks,
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
  }
}

function toQueuedProjectTaskSync(
  queuedSync: ScopedQueuedProjectTaskSync,
): QueuedProjectTaskSync {
  return {
    projectId: queuedSync.projectId,
    tasks: queuedSync.tasks,
    mutationId: queuedSync.mutationId,
    queuedAt: queuedSync.queuedAt,
    ...(queuedSync.expectedRevision === undefined
      ? {}
      : { expectedRevision: queuedSync.expectedRevision }),
  }
}

function createStorageId(authScope: string, projectId: string) {
  return `${authScope}:${encodeURIComponent(projectId)}`
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
          database.createObjectStore(taskStoreName, { keyPath: 'storageId' })
        }
        if (!database.objectStoreNames.contains(taskSyncQueueStoreName)) {
          database.createObjectStore(taskSyncQueueStoreName, {
            keyPath: 'storageId',
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

function readStoreValue(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<unknown> {
  const objectStore = database
    .transaction(storeName, 'readonly')
    .objectStore(storeName)
  return requestToPromise(objectStore.get(key) as IDBRequest<unknown>)
}

function writeStoreValue(
  database: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<void> {
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).put(value)
  return transactionToPromise(transaction)
}

function deleteStoreValue(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<void> {
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).delete(key)
  return transactionToPromise(transaction)
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
      const error = transaction.error ?? new Error('IndexedDB transaction aborted')
      reportBrowserStorageFailure('indexed-db', error)
      reject(error)
    }
  })
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}
