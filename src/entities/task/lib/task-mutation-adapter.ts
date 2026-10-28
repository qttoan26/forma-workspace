import type { Task } from '@/entities/task/model/task'

import { saveProjectTasks } from './task-storage'

export interface TaskMutationAdapter {
  persist: (projectId: string, tasks: Task[]) => Promise<void>
}

export function createBrowserTaskMutationAdapter(
  storage?: Storage,
): TaskMutationAdapter {
  return {
    async persist(projectId, tasks) {
      saveProjectTasks(projectId, tasks, storage ?? window.localStorage)
    },
  }
}
