import { z } from 'zod'

import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import {
  resolveBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/shared/lib/browser-storage-health'

import type { QueuedProjectTaskSync } from './task-indexed-db'

const syncVersion = 'v1'

const queuedProjectTaskSyncSchema = z.object({
  projectId: z.string().min(1),
  tasks: taskCollectionSchema,
  mutationId: z.string().min(1),
  queuedAt: z.string(),
})

export function enqueueSessionProjectTaskSync(
  projectId: string,
  tasks: Task[],
): QueuedProjectTaskSync | null {
  const queuedSync: QueuedProjectTaskSync = {
    projectId,
    tasks: parseProjectTasks(projectId, tasks),
    mutationId: createMutationId(),
    queuedAt: new Date().toISOString(),
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
  const raw = safeStorageGetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    queueKey(projectId),
  )
  if (!raw) return null

  try {
    const parsed = queuedProjectTaskSyncSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.projectId !== projectId) {
      clearSessionProjectTaskSync(projectId)
      return null
    }
    if (!parsed.data.tasks.every((task) => task.projectId === projectId)) {
      clearSessionProjectTaskSync(projectId)
      return null
    }
    return parsed.data
  } catch {
    clearSessionProjectTaskSync(projectId)
    return null
  }
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
  return safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    queueKey(projectId),
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
  return `forma:task-sync:${syncVersion}:queue:${projectId}`
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
