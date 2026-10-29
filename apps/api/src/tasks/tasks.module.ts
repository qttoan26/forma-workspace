import { Module } from '@nestjs/common'

import { PostgresTaskRepository } from './postgres-task.repository'
import { InMemoryTaskRepository, TASK_REPOSITORY } from './task.repository'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    {
      provide: TASK_REPOSITORY,
      useFactory: () =>
        process.env.DATABASE_URL
          ? new PostgresTaskRepository()
          : new InMemoryTaskRepository(),
    },
  ],
})
export class TasksModule {}
