import { Module } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { MongoDatabaseModule } from './database/mongo-database.module'
import { DeliveryModule } from './delivery/delivery.module'
import { HealthController } from './health.controller'
import { OrganizationMembershipModule } from './organizations/organization-membership.module'
import { TasksModule } from './tasks/tasks.module'

@Module({
  imports: [
    AuthModule,
    MongoDatabaseModule,
    TasksModule,
    OrganizationMembershipModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
