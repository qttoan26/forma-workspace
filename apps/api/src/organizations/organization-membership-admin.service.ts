import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { MongoServerError } from 'mongodb'

import type { AuthenticatedUser } from '../auth/auth.types'
import { MongoDatabaseService } from '../database/mongo-database.service'
import {
  type OrganizationMembership,
  organizationMembershipCollection,
  organizationMembershipId,
  type OrganizationScope,
} from './organization-membership.service'

export const organizationMembershipAdminCollection =
  'organization_membership_admins'

interface OrganizationMembershipAdmin {
  _id: string
  active: boolean
}

@Injectable()
export class OrganizationMembershipAdminService {
  constructor(private readonly database: MongoDatabaseService) {}

  async getAccess(
    actor: AuthenticatedUser,
    scope: OrganizationScope,
    accountId: string,
  ) {
    await this.requireAdmin(actor, scope)
    const membership = await this.memberships.findOne(
      { _id: organizationMembershipId(scope, accountId) },
      {
        readPreference: 'primary',
        projection: { state: 1, deliveryRead: 1, revision: 1 },
      },
    )

    return {
      deliveryRead:
        membership?.state === 'active' && membership.deliveryRead === true,
      revision: membership?.revision ?? 0,
    }
  }

  async setAccess(
    actor: AuthenticatedUser,
    scope: OrganizationScope,
    accountId: string,
    change: { deliveryRead: boolean; expectedRevision: number },
  ) {
    await this.requireAdmin(actor, scope)
    const { deliveryRead, expectedRevision } = change
    const revision = expectedRevision + 1
    const _id = organizationMembershipId(scope, accountId)

    try {
      const result = await this.memberships.updateOne(
        expectedRevision === 0
          ? { _id, $or: [{ revision: 0 }, { revision: { $exists: false } }] }
          : { _id, revision: expectedRevision },
        {
          $set: {
            state: deliveryRead ? 'active' : 'revoked',
            deliveryRead,
            revision,
            updatedBy: actor.id,
            updatedAt: new Date(),
          },
        },
        { upsert: expectedRevision === 0, writeConcern: { w: 'majority' } },
      )
      if (result.matchedCount || result.upsertedCount) {
        return { deliveryRead, revision }
      }
    } catch (error) {
      // An initial write can race another write that creates or upgrades the record.
      if (
        expectedRevision !== 0 ||
        !(error instanceof MongoServerError && error.code === 11000)
      ) {
        throw error
      }
    }

    throw new ConflictException('Membership revision conflict')
  }

  private get memberships() {
    return this.database.collection<OrganizationMembership>(
      organizationMembershipCollection,
    )
  }

  private async requireAdmin(
    actor: AuthenticatedUser,
    scope: OrganizationScope,
  ) {
    if (!this.database.isConfigured) {
      throw new ServiceUnavailableException(
        'Membership administration unavailable',
      )
    }

    const admin = await this.database
      .collection<OrganizationMembershipAdmin>(
        organizationMembershipAdminCollection,
      )
      .findOne(
        { _id: organizationMembershipId(scope, actor.id) },
        { readPreference: 'primary', projection: { active: 1 } },
      )
    if (admin?.active !== true) {
      throw new NotFoundException('Organization not found')
    }
  }
}
