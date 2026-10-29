import {
  taskCollectionSchema,
  type Task,
} from '@/entities/task/model/task'

import {
  createTaskMutationEffectBoundary,
  type TaskMutationAdapter,
  type TaskMutationFailureHandler,
} from './task-mutation-adapter'

export function getTaskApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
}

export async function loadProjectTasksFromApi(
  projectId: string,
  baseUrl = getTaskApiBaseUrl(),
) {
  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`)

  if (!response.ok) {
    throw new Error(`Failed to load project tasks (${response.status})`)
  }

  const body = (await response.json()) as { tasks?: unknown }
  return taskCollectionSchema.parse(body.tasks)
}

export function createApiTaskMutationAdapter(
  baseUrl = getTaskApiBaseUrl(),
  onFailure?: TaskMutationFailureHandler,
): TaskMutationAdapter {
  const apiAdapter: TaskMutationAdapter = {
    async persist(projectId: string, tasks: Task[]) {
      const response = await fetch(
        `${baseUrl}/api/projects/${projectId}/tasks`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to persist project tasks (${response.status})`)
      }
    },
  }

  return createTaskMutationEffectBoundary(apiAdapter, onFailure)
}
