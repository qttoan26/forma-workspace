import { Inject, Injectable } from '@nestjs/common'

import type { TaskRecord } from './task.schema'
import { TASK_REPOSITORY, type TaskRepository } from './task.repository'

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  replaceProjectTasks(
    ownerId: string,
    projectId: string,
    tasks: TaskRecord[],
    expectedRevision?: number,
  ) {
    return this.taskRepository.replaceProjectTasks(
      ownerId,
      projectId,
      tasks,
      expectedRevision,
    )
  }

  getProjectTasks(ownerId: string, projectId: string) {
    return this.taskRepository.getProjectTasks(ownerId, projectId)
  }
}
