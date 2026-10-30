import { z } from 'zod'

import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import { getFrontendAuthStorageScope } from '@/shared/lib/auth-session'
import {
  resolveBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/shared/lib/browser-storage-health'

import type { QueuedProjectTaskSync } from './task-indexed-db'

const syncVersion = 'v2'
const legacySyncVersion = 'v1'
const localDevelopmentStorageScope = 'local-development-user'

const queuedProjectTaskSyncSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  mutationId: z.string().min(1),
  queuedAt: z.string(),
  expectedRevision: z.number().int().nonnegative().optional(),
})

export function enqueueSessionProjectTaskSync(
  projectId: string,
  tasks: Task[],
  expectedRevision?: number,
): QueuedProjectTaskSync | null {
  const queuedSync: QueuedProjectTaskSync = {
    projectId,
    tasks: parseProjectTasks(projectId, tasks),
    mutationId: createMutationId(),
    queuedAt: new Date().toISOString(),
    ...(expectedRevision === undefined ? {} : { expectedRevision }),
  }

  const stored = safeStorageSetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    queueKey(projectId),
    JSON.stringify(queuedSync),
  )

  return stored ? queuedSync : null
}

export function loadSessionProjectTaskSync(
  projectId: string,
): QueuedProjectTaskSync | null {
  const storage = resolveBrowserStorage('session-storage')
  const currentKey = queueKey(projectId)
  const raw = safeStorageGetItem('session-storage', storage, currentKey)
  if (raw) return parseQueuedSync(projectId, raw, currentKey)

  if (getFrontendAuthStorageScope() !== localDevelopmentStorageScope) {
    return null
  }

  const oldKey = legacyQueueKey(projectId)
  const legacy = safeStorageGetItem('session-storage', storage, oldKey)
  if (!legacy) return null

  const queuedSync = parseQueuedSync(projectId, legacy, oldKey)
  if (!queuedSync) return null

  safeStorageSetItem(
    'session-storage',
    storage,
    currentKey,
    JSON.stringify(queuedSync),
  )
  safeStorageRemoveItem('session-storage', storage, oldKey)
  return queuedSync
}

export function completeSessionProjectTaskSync(
  projectId: string,
  mutationId: string,
): boolean {
  const queuedSync = loadSessionProjectTaskSync(projectId)
  if (!queuedSync || queuedSync.mutationId !== mutationId) return false

  return clearSessionProjectTaskSync(projectId)
}

export function clearSessionProjectTaskSync(projectId: string): boolean {
  const storage = resolveBrowserStorage('session-storage')
  const removed = safeStorageRemoveItem(
    'session-storage',
    storage,
    queueKey(projectId),
  )
  if (getFrontendAuthStorageScope() === localDevelopmentStorageScope) {
    safeStorageRemoveItem(
      'session-storage',
      storage,
      legacyQueueKey(projectId),
    )
  }
  return removed
}

function parseQueuedSync(projectId: string, raw: string, key: string) {
  try {
    const parsed = queuedProjectTaskSyncSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.projectId !== projectId) {
      removeQueueKey(key)
      return null
    }
    if (!parsed.data.tasks.every((task) => task.projectId === projectId)) {
      removeQueueKey(key)
      return null
    }
    return parsed.data
  } catch {
    removeQueueKey(key)
    return null
  }
}

function removeQueueKey(key: string) {
  safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    key,
  )
}

function parseProjectTasks(projectId: string, tasks: Task[]) {
  const parsed = taskCollectionSchema.parse(tasks)
  if (!parsed.every((task) => task.projectId === projectId)) {
    throw new Error('Task collection does not match project')
  }
  return parsed
}

function queueKey(projectId: string) {
  return `forma:task-sync:${syncVersion}:queue:${getFrontendAuthStorageScope()}:${projectId}`
}

function legacyQueueKey(projectId: string) {
  return `forma:task-sync:${legacySyncVersion}:queue:${projectId}`
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
