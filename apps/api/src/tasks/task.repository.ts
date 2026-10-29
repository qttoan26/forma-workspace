import { Injectable } from '@nestjs/common'

import type { TaskRecord } from './task.schema'

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY')

export interface TaskRepository {
  replaceProjectTasks: (projectId: string, tasks: TaskRecord[]) => Promise<void>
  getProjectTasks: (projectId: string) => Promise<TaskRecord[]>
}

@Injectable()
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasksByProject = new Map<string, TaskRecord[]>()

  async replaceProjectTasks(projectId: string, tasks: TaskRecord[]) {
    this.tasksByProject.set(
      projectId,
      tasks.map((task) => ({ ...task })),
    )
  }

  async getProjectTasks(projectId: string) {
    return (
      this.tasksByProject.get(projectId)?.map((task) => ({ ...task })) ?? []
    )
  }
}
