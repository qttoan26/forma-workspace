import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Put,
} from '@nestjs/common'

import type { AuthenticatedUser } from '../auth/auth.types'
import { CurrentUser } from '../auth/current-user.decorator'
import {
  deliveryRelationshipChange,
  deliveryRelationshipParams,
} from './delivery-relationship.schema'
import { DeliveryRelationshipService } from './delivery-relationship.service'

@Controller(
  'admin/workspaces/:workspaceId/projects/:projectId/:audience/relationships/:relationshipId',
)
export class DeliveryRelationshipController {
  constructor(private readonly relationships: DeliveryRelationshipService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  get(@Param() params: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const { relationshipId, ...scope } = parseParams(params)
    return this.relationships.get(actor, scope, relationshipId)
  }

  @Put()
  @Header('Cache-Control', 'private, no-store')
  set(
    @Param() params: unknown,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const { relationshipId, ...scope } = parseParams(params)
    const change = deliveryRelationshipChange.safeParse(body)
    if (!change.success) {
      throw new BadRequestException('Invalid delivery relationship change')
    }
    return this.relationships.set(actor, scope, relationshipId, change.data)
  }
}

function parseParams(params: unknown) {
  const parsed = deliveryRelationshipParams.safeParse(params)
  if (!parsed.success) {
    throw new BadRequestException('Invalid delivery relationship scope')
  }
  return parsed.data
}
