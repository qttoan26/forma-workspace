import type { Task } from '@/entities/task/model/task'

import { saveProjectTasks } from './task-storage'

export interface TaskMutationAdapter {
  persist: (projectId: string, tasks: Task[]) => Promise<void>
}

export type TaskMutationFailureHandler = (error: unknown) => void

export function createTaskMutationEffectBoundary(
  adapter: TaskMutationAdapter,
  onFailure?: TaskMutationFailureHandler,
): TaskMutationAdapter {
  let isInitialSync = true

  return {
    persist(projectId, tasks) {
      if (isInitialSync) {
        isInitialSync = false
        return Promise.resolve()
      }

      return adapter.persist(projectId, tasks).catch((error: unknown) => {
        onFailure?.(error)
      })
    },
  }
}

export function createBrowserTaskMutationAdapter(
  storage?: Storage,
  onFailure?: TaskMutationFailureHandler,
): TaskMutationAdapter {
  const browserAdapter: TaskMutationAdapter = {
    persist(projectId, tasks) {
      try {
        saveProjectTasks(projectId, tasks, storage ?? window.localStorage)
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(toError(error))
      }
    },
  }

  return createTaskMutationEffectBoundary(browserAdapter, onFailure)
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
