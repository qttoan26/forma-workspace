import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import { getFrontendAuthStorageScope } from '@/shared/lib/auth-session'

import type { QueuedProjectTaskSync } from './task-indexed-db'

export const memoryProjectTaskSyncChangeEvent =
  'forma:memory-project-task-sync-change'

const queuedProjectSyncs = new Map<string, QueuedProjectTaskSync>()

export function enqueueMemoryProjectTaskSync(
  projectId: string,
  tasks: Task[],
  expectedRevision?: number,
): QueuedProjectTaskSync {
  const queuedSync: QueuedProjectTaskSync = {
    projectId,
    tasks: parseProjectTasks(projectId, tasks),
    mutationId: createMutationId(),
    queuedAt: new Date().toISOString(),
    ...(expectedRevision === undefined ? {} : { expectedRevision }),
  }
  queuedProjectSyncs.set(queueKey(projectId), queuedSync)
  notifyMemoryProjectTaskSyncChange(projectId)
  return queuedSync
}

export function loadMemoryProjectTaskSync(
  projectId: string,
): QueuedProjectTaskSync | null {
  return queuedProjectSyncs.get(queueKey(projectId)) ?? null
}

export function hasMemoryProjectTaskSync(projectId: string): boolean {
  return queuedProjectSyncs.has(queueKey(projectId))
}

export function completeMemoryProjectTaskSync(
  projectId: string,
  mutationId: string,
): boolean {
  const key = queueKey(projectId)
  const queuedSync = queuedProjectSyncs.get(key)
  if (!queuedSync || queuedSync.mutationId !== mutationId) return false

  queuedProjectSyncs.delete(key)
  notifyMemoryProjectTaskSyncChange(projectId)
  return true
}

export function clearMemoryProjectTaskSync(projectId: string) {
  const deleted = queuedProjectSyncs.delete(queueKey(projectId))
  if (deleted) notifyMemoryProjectTaskSyncChange(projectId)
}

function notifyMemoryProjectTaskSyncChange(projectId: string) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent(memoryProjectTaskSyncChangeEvent, {
      detail: { projectId },
    }),
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
  return `${getFrontendAuthStorageScope()}:${projectId}`
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
