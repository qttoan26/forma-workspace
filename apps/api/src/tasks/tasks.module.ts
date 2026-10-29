import { Module } from '@nestjs/common'

import { InMemoryTaskRepository, TASK_REPOSITORY } from './task.repository'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    InMemoryTaskRepository,
    {
      provide: TASK_REPOSITORY,
      useExisting: InMemoryTaskRepository,
    },
  ],
})
export class TasksModule {}
