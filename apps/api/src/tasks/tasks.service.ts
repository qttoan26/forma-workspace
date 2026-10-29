import { Injectable } from '@nestjs/common'

import type { TaskRecord } from './task.schema'

@Injectable()
export class TasksService {
  private readonly tasksByProject = new Map<string, TaskRecord[]>()

  replaceProjectTasks(projectId: string, tasks: TaskRecord[]) {
    this.tasksByProject.set(
      projectId,
      tasks.map((task) => ({ ...task })),
    )
  }

  getProjectTasks(projectId: string) {
    return (
      this.tasksByProject.get(projectId)?.map((task) => ({ ...task })) ?? []
    )
  }
}
