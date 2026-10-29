import { taskCollectionSchema, type Task } from '@/entities/task/model/task'

import type { QueuedProjectTaskSync } from './task-indexed-db'

const queuedProjectSyncs = new Map<string, QueuedProjectTaskSync>()

export function enqueueMemoryProjectTaskSync(
  projectId: string,
  tasks: Task[],
): QueuedProjectTaskSync {
  const queuedSync: QueuedProjectTaskSync = {
    projectId,
    tasks: parseProjectTasks(projectId, tasks),
    mutationId: createMutationId(),
    queuedAt: new Date().toISOString(),
  }
  queuedProjectSyncs.set(projectId, queuedSync)
  return queuedSync
}

export function loadMemoryProjectTaskSync(
  projectId: string,
): QueuedProjectTaskSync | null {
  return queuedProjectSyncs.get(projectId) ?? null
}

export function completeMemoryProjectTaskSync(
  projectId: string,
  mutationId: string,
): boolean {
  const queuedSync = queuedProjectSyncs.get(projectId)
  if (!queuedSync || queuedSync.mutationId !== mutationId) return false

  queuedProjectSyncs.delete(projectId)
  return true
}

export function clearMemoryProjectTaskSync(projectId: string) {
  queuedProjectSyncs.delete(projectId)
}

function parseProjectTasks(projectId: string, tasks: Task[]) {
  const parsed = taskCollectionSchema.parse(tasks)
  if (!parsed.every((task) => task.projectId === projectId)) {
    throw new Error('Task collection does not match project')
  }
  return parsed
}

function createMutationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
