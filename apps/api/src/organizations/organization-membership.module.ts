import { Module } from '@nestjs/common'

import { OrganizationMembershipAdminController } from './organization-membership-admin.controller'
import { OrganizationMembershipAdminService } from './organization-membership-admin.service'
import { OrganizationMembershipService } from './organization-membership.service'

@Module({
  controllers: [OrganizationMembershipAdminController],
  providers: [
    OrganizationMembershipService,
    OrganizationMembershipAdminService,
  ],
  exports: [OrganizationMembershipService],
})
export class OrganizationMembershipModule {}
