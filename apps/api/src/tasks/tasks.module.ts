import { Module } from '@nestjs/common'

import { MongoTaskRepository } from './mongo-task.repository'
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
        process.env.MONGODB_URI
          ? new MongoTaskRepository()
          : new InMemoryTaskRepository(),
    },
  ],
})
export class TasksModule {}
