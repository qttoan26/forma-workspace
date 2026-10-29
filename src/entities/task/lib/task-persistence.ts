import type { Task } from '@/entities/task/model/task'

import {
  getTaskApiBaseUrl,
  loadProjectTasksFromApi,
  persistProjectTasksToApi,
} from './task-api'
import {
  loadProjectTasksFromIndexedDb,
  saveProjectTasksToIndexedDb,
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

      if (!apiBaseUrl) return

      markProjectTaskSyncPending(projectId)
      await persistProjectTasksToApi(projectId, tasks, apiBaseUrl)
      recordProjectTaskSyncSuccess(projectId)
    },
  }

  return createTaskMutationEffectBoundary(localFirstAdapter, onFailure)
}

async function cacheProjectTasks(projectId: string, tasks: Task[]) {
  try {
    await saveProjectTasksToIndexedDb(projectId, tasks)
  } catch {
    saveProjectTasks(projectId, tasks)
  }
}
