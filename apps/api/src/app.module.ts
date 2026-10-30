import { Module } from '@nestjs/common'

import { HealthController } from './health.controller'
import { TasksModule } from './tasks/tasks.module'

@Module({
  imports: [TasksModule],
  controllers: [HealthController],
})
export class AppModule {}
