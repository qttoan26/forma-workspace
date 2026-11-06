import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Put,
} from '@nestjs/common'
import { z } from 'zod'

import type { AuthenticatedUser } from '../auth/auth.types'
import { CurrentUser } from '../auth/current-user.decorator'
import { OrganizationMembershipAdminService } from './organization-membership-admin.service'

const identifier = z.string().refine((value) => value.trim().length > 0)
const membershipParams = z.object({
  workspaceId: identifier,
  organizationId: identifier,
  audience: z.enum(['customer', 'vendor']),
  accountId: identifier,
})
const accessChange = z.strictObject({
  deliveryRead: z.boolean(),
  expectedRevision: z
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER - 1),
})

@Controller(
  'admin/workspaces/:workspaceId/organizations/:organizationId/:audience/memberships/:accountId/delivery-access',
)
export class OrganizationMembershipAdminController {
  constructor(private readonly admin: OrganizationMembershipAdminService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  getAccess(@Param() params: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const { accountId, ...scope } = parseMembershipParams(params)
    return this.admin.getAccess(actor, scope, accountId)
  }

  @Put()
  @Header('Cache-Control', 'private, no-store')
  setAccess(
    @Param() params: unknown,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const { accountId, ...scope } = parseMembershipParams(params)
    const change = accessChange.safeParse(body)
    if (!change.success) {
      throw new BadRequestException('Invalid delivery access change')
    }
    return this.admin.setAccess(actor, scope, accountId, change.data)
  }
}

function parseMembershipParams(params: unknown) {
  const parsed = membershipParams.safeParse(params)
  if (!parsed.success) {
    throw new BadRequestException('Invalid membership scope')
  }
  return parsed.data
}
