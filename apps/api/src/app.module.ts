import { Module } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { MongoDatabaseModule } from './database/mongo-database.module'
import { HealthController } from './health.controller'
import { TasksModule } from './tasks/tasks.module'

@Module({
  imports: [AuthModule, MongoDatabaseModule, TasksModule],
  controllers: [HealthController],
})
export class AppModule {}
