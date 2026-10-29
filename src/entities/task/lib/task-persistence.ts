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
  createTaskMutationEffectBoundary,
  type TaskMutationAdapter,
  type TaskMutationFailureHandler,
} from './task-mutation-adapter'
import {
  clearProjectTasks,
  loadProjectTasks,
  saveProjectTasks,
} from './task-storage'
import {
  markProjectTaskSyncPending,
  recordProjectTaskSyncSuccess,
} from './task-sync-storage'

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
      await cacheProjectTasks(projectId, tasks)
      publishProjectTasks(projectId, tasks)

      if (!apiBaseUrl) return

      const queuedSync = await enqueueProjectTaskSync(projectId, tasks).catch(
        () => null,
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
    const queuedSync = await loadQueuedProjectTaskSync(projectId)
    if (!queuedSync) return

    markProjectTaskSyncPending(projectId)
    await syncProjectTasks(projectId, queuedSync.tasks, apiBaseUrl, queuedSync)
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
    const queuedSync = await loadQueuedProjectTaskSync(projectId)
    if (queuedSync) return

    const tasks = await loadProjectTasksFromApi(projectId, apiBaseUrl)
    await cacheProjectTasks(projectId, tasks)
    publishProjectTasks(projectId, tasks)
    notifyProjectTasks(projectId, tasks)
  } catch (error) {
    onFailure?.(error)
  }
}

async function syncProjectTasks(
  projectId: string,
  tasks: Task[],
  apiBaseUrl: string,
  queuedSync: QueuedProjectTaskSync | null,
) {
  await persistProjectTasksToApi(projectId, tasks, apiBaseUrl)

  if (queuedSync) {
    const completed = await completeProjectTaskSync(
      projectId,
      queuedSync.mutationId,
    )
    if (!completed) return
  }

  recordProjectTaskSyncSuccess(projectId)
}

async function cacheProjectTasks(projectId: string, tasks: Task[]) {
  try {
    await saveProjectTasksToIndexedDb(projectId, tasks)
  } catch {
    saveProjectTasks(projectId, tasks)
  }
}
