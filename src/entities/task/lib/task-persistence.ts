import type { Task } from '@/entities/task/model/task'

import {
  getTaskApiBaseUrl,
  loadProjectTasksFromApi,
  persistProjectTasksToApi,
} from './task-api'
import { notifyProjectTasks, publishProjectTasks } from './task-broadcast'
import {
  completeProjectTaskSync,
  enqueueProjectTaskSync,
  loadProjectTasksFromIndexedDb,
  loadQueuedProjectTaskSync,
  saveProjectTasksToIndexedDb,
  type QueuedProjectTaskSync,
} from './task-indexed-db'
import {
  clearMemoryProjectTaskSync,
  completeMemoryProjectTaskSync,
  enqueueMemoryProjectTaskSync,
  loadMemoryProjectTaskSync,
} from './task-memory-sync-queue'
import {
  createTaskMutationEffectBoundary,
  type TaskMutationAdapter,
  type TaskMutationFailureHandler,
} from './task-mutation-adapter'
import {
  clearSessionProjectTaskSync,
  completeSessionProjectTaskSync,
  enqueueSessionProjectTaskSync,
  loadSessionProjectTaskSync,
} from './task-session-sync-queue'
import {
  clearProjectTasks,
  loadProjectTasks,
  saveProjectTasks,
} from './task-storage'
import {
  markProjectTaskSyncPending,
  recordProjectTaskSyncSuccess,
} from './task-sync-storage'

interface RecoverableQueuedProjectTaskSync {
  source: 'indexed-db' | 'session-storage' | 'memory'
  queuedSync: QueuedProjectTaskSync
}

export async function loadConfiguredProjectTasks(
  projectId: string,
  fallback: Task[],
): Promise<Task[]> {
  const indexedDbTasks = await loadProjectTasksFromIndexedDb(projectId).catch(
    () => null,
  )
  if (indexedDbTasks) return indexedDbTasks

  const legacyTasks = loadProjectTasks(projectId, [])
  if (legacyTasks.length > 0) {
    const migrated = await saveProjectTasksToIndexedDb(projectId, legacyTasks)
      .then(() => true)
      .catch(() => false)
    if (migrated) clearProjectTasks(projectId)
    return legacyTasks
  }

  const apiBaseUrl = getTaskApiBaseUrl()
  if (apiBaseUrl) {
    const apiTasks = await loadProjectTasksFromApi(projectId, apiBaseUrl)
    await cacheProjectTasks(projectId, apiTasks)
    return apiTasks
  }

  await cacheProjectTasks(projectId, fallback)
  return fallback
}

export function createConfiguredTaskMutationAdapter(
  onFailure?: TaskMutationFailureHandler,
): TaskMutationAdapter {
  const apiBaseUrl = getTaskApiBaseUrl()
  const localFirstAdapter: TaskMutationAdapter = {
    async persist(projectId, tasks) {
      const revision = await cacheProjectTasks(projectId, tasks)
      publishProjectTasks(projectId, tasks, revision)

      if (!apiBaseUrl) return

      const queuedSync = await enqueueRecoverableProjectTaskSync(
        projectId,
        tasks,
      )
      markProjectTaskSyncPending(projectId)
      await syncProjectTasks(projectId, tasks, apiBaseUrl, queuedSync)
    },
  }

  return createTaskMutationEffectBoundary(localFirstAdapter, onFailure)
}

export async function retryConfiguredProjectTaskSync(
  projectId: string,
  onFailure?: TaskMutationFailureHandler,
): Promise<void> {
  const apiBaseUrl = getTaskApiBaseUrl()
  if (!apiBaseUrl) return

  try {
    const queuedSync = await loadRecoverableProjectTaskSync(projectId)
    if (!queuedSync) return

    markProjectTaskSyncPending(projectId)
    await syncProjectTasks(
      projectId,
      queuedSync.queuedSync.tasks,
      apiBaseUrl,
      queuedSync,
    )
  } catch (error) {
    onFailure?.(error)
  }
}

export async function refreshConfiguredProjectTasks(
  projectId: string,
  onFailure?: TaskMutationFailureHandler,
): Promise<void> {
  const apiBaseUrl = getTaskApiBaseUrl()
  if (!apiBaseUrl) return

  try {
    const queuedSync = await loadRecoverableProjectTaskSync(projectId)
    if (queuedSync) return

    const tasks = await loadProjectTasksFromApi(projectId, apiBaseUrl)
    const revision = await cacheProjectTasks(projectId, tasks)
    publishProjectTasks(projectId, tasks, revision)
    notifyProjectTasks(projectId, tasks, revision)
  } catch (error) {
    onFailure?.(error)
  }
}

async function syncProjectTasks(
  projectId: string,
  tasks: Task[],
  apiBaseUrl: string,
  queuedSync: RecoverableQueuedProjectTaskSync | null,
) {
  await persistProjectTasksToApi(projectId, tasks, apiBaseUrl)

  if (queuedSync) {
    const completed = await completeRecoverableProjectTaskSync(queuedSync)
    if (!completed) return
  }

  recordProjectTaskSyncSuccess(projectId)
}

async function enqueueRecoverableProjectTaskSync(
  projectId: string,
  tasks: Task[],
): Promise<RecoverableQueuedProjectTaskSync> {
  const indexedDbQueuedSync = await enqueueProjectTaskSync(
    projectId,
    tasks,
  ).catch(() => null)

  if (indexedDbQueuedSync) {
    clearSessionProjectTaskSync(projectId)
    clearMemoryProjectTaskSync(projectId)
    return {
      source: 'indexed-db',
      queuedSync: indexedDbQueuedSync,
    }
  }

  const sessionQueuedSync = enqueueSessionProjectTaskSync(projectId, tasks)
  if (sessionQueuedSync) {
    clearMemoryProjectTaskSync(projectId)
    return {
      source: 'session-storage',
      queuedSync: sessionQueuedSync,
    }
  }

  return {
    source: 'memory',
    queuedSync: enqueueMemoryProjectTaskSync(projectId, tasks),
  }
}

async function loadRecoverableProjectTaskSync(
  projectId: string,
): Promise<RecoverableQueuedProjectTaskSync | null> {
  const indexedDbQueuedSync = await loadQueuedProjectTaskSync(projectId).catch(
    () => null,
  )
  if (indexedDbQueuedSync) {
    return {
      source: 'indexed-db',
      queuedSync: indexedDbQueuedSync,
    }
  }

  const sessionQueuedSync = loadSessionProjectTaskSync(projectId)
  if (sessionQueuedSync) {
    return {
      source: 'session-storage',
      queuedSync: sessionQueuedSync,
    }
  }

  const memoryQueuedSync = loadMemoryProjectTaskSync(projectId)
  if (!memoryQueuedSync) return null

  return {
    source: 'memory',
    queuedSync: memoryQueuedSync,
  }
}

async function completeRecoverableProjectTaskSync(
  recoverableSync: RecoverableQueuedProjectTaskSync,
): Promise<boolean> {
  const { source, queuedSync } = recoverableSync
  if (source === 'session-storage') {
    return completeSessionProjectTaskSync(
      queuedSync.projectId,
      queuedSync.mutationId,
    )
  }
  if (source === 'memory') {
    return completeMemoryProjectTaskSync(
      queuedSync.projectId,
      queuedSync.mutationId,
    )
  }

  return completeProjectTaskSync(queuedSync.projectId, queuedSync.mutationId)
}

async function cacheProjectTasks(
  projectId: string,
  tasks: Task[],
): Promise<number | null> {
  try {
    const snapshot = await saveProjectTasksToIndexedDb(projectId, tasks)
    return snapshot.revision
  } catch {
    saveProjectTasks(projectId, tasks)
    return null
  }
}
