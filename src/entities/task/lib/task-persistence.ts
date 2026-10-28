import type { Task } from '@/entities/task/model/task'

import { loadProjectTasks, saveProjectTasks } from './task-storage'

export interface TaskCollectionPersistence {
  load: (projectId: string, fallback: Task[]) => Task[]
  save: (projectId: string, tasks: Task[]) => void
}

export const localTaskCollectionPersistence: TaskCollectionPersistence = {
  load: loadProjectTasks,
  save: saveProjectTasks,
}
