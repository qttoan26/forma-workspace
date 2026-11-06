import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../auth/auth.types'
import { MongoDatabaseService } from '../database/mongo-database.service'

export interface OrganizationScope {
  workspaceId: string
  organizationId: string
  audience: 'customer' | 'vendor'
}

export interface OrganizationMembership {
  _id: string
  state: 'inactive' | 'active' | 'revoked'
  deliveryRead: boolean
  revision?: number
  updatedBy?: string
  updatedAt?: Date
}

export const organizationMembershipCollection = 'organization_memberships'

export function organizationMembershipId(
  scope: OrganizationScope,
  accountId: string,
): string {
  // A tuple keeps the unique MongoDB key unambiguous across identifier values.
  return JSON.stringify([
    scope.workspaceId,
    scope.organizationId,
    scope.audience,
    accountId,
  ])
}

@Injectable()
export class OrganizationMembershipService {
  constructor(private readonly database: MongoDatabaseService) {}

  async canReadDelivery(
    user: AuthenticatedUser,
    scope: OrganizationScope,
  ): Promise<boolean> {
    if (
      !this.database.isConfigured ||
      !isIdentifier(user.id) ||
      !isIdentifier(scope.workspaceId) ||
      !isIdentifier(scope.organizationId) ||
      (scope.audience !== 'customer' && scope.audience !== 'vendor')
    ) {
      return false
    }

    const id = organizationMembershipId(scope, user.id)
    const membership = await this.database
      .collection<OrganizationMembership>(organizationMembershipCollection)
      .findOne(
        { _id: id },
        {
          readPreference: 'primary',
          projection: { state: 1, deliveryRead: 1 },
        },
      )

    return (
      membership?._id === id &&
      membership.state === 'active' &&
      membership.deliveryRead === true
    )
  }
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
