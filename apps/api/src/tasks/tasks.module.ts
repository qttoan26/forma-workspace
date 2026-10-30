import { Module } from '@nestjs/common'

import { MongoDatabaseService } from '../database/mongo-database.service'
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
      inject: [MongoDatabaseService],
      useFactory: (database: MongoDatabaseService) =>
        database.isConfigured
          ? new MongoTaskRepository(database)
          : new InMemoryTaskRepository(),
    },
  ],
})
export class TasksModule {}
