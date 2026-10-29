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
import { clearProjectTasks, loadProjectTasks } from './task-storage'
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
    await saveProjectTasksToIndexedDb(projectId, legacyTasks).catch(() => undefined)
    clearProjectTasks(projectId)
    return legacyTasks
  }

  const apiBaseUrl = getTaskApiBaseUrl()
  if (apiBaseUrl) {
    const apiTasks = await loadProjectTasksFromApi(projectId, apiBaseUrl)
    await saveProjectTasksToIndexedDb(projectId, apiTasks).catch(() => undefined)
    return apiTasks
  }

  await saveProjectTasksToIndexedDb(projectId, fallback).catch(() => undefined)
  return fallback
}

export function createConfiguredTaskMutationAdapter(
  onFailure?: TaskMutationFailureHandler,
): TaskMutationAdapter {
  const apiBaseUrl = getTaskApiBaseUrl()
  const localFirstAdapter: TaskMutationAdapter = {
    async persist(projectId, tasks) {
      await saveProjectTasksToIndexedDb(projectId, tasks)

      if (!apiBaseUrl) return

      markProjectTaskSyncPending(projectId)
      await persistProjectTasksToApi(projectId, tasks, apiBaseUrl)
      recordProjectTaskSyncSuccess(projectId)
    },
  }

  return createTaskMutationEffectBoundary(localFirstAdapter, onFailure)
}
