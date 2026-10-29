import { Inject, Injectable } from '@nestjs/common'

import type { TaskRecord } from './task.schema'
import { TASK_REPOSITORY, type TaskRepository } from './task.repository'

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  async replaceProjectTasks(projectId: string, tasks: TaskRecord[]) {
    await this.taskRepository.replaceProjectTasks(projectId, tasks)
  }

  async getProjectTasks(projectId: string) {
    return this.taskRepository.getProjectTasks(projectId)
  }
}
