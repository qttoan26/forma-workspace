import type { Task } from '@/entities/task/model/task'

import { createApiTaskMutationAdapter, getTaskApiBaseUrl } from './task-api'
import {
  createBrowserTaskMutationAdapter,
  type TaskMutationFailureHandler,
} from './task-mutation-adapter'
import { loadProjectTasks } from './task-storage'

export function resolveInitialProjectTasks(projectId: string, tasks: Task[]) {
  return getTaskApiBaseUrl() ? tasks : loadProjectTasks(projectId, tasks)
}

export function createConfiguredTaskMutationAdapter(
  onFailure?: TaskMutationFailureHandler,
) {
  const apiBaseUrl = getTaskApiBaseUrl()

  return apiBaseUrl
    ? createApiTaskMutationAdapter(apiBaseUrl, onFailure)
    : createBrowserTaskMutationAdapter(undefined, onFailure)
}
