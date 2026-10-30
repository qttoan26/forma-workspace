import { Module } from '@nestjs/common'

import { MongoDatabaseModule } from './database/mongo-database.module'
import { HealthController } from './health.controller'
import { TasksModule } from './tasks/tasks.module'

@Module({
  imports: [MongoDatabaseModule, TasksModule],
  controllers: [HealthController],
})
export class AppModule {}
