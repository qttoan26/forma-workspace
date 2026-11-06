import { Module } from '@nestjs/common'

import { OrganizationMembershipService } from './organization-membership.service'

@Module({
  providers: [OrganizationMembershipService],
  exports: [OrganizationMembershipService],
})
export class OrganizationMembershipModule {}
