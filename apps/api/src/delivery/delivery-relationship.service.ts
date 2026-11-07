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
  type DeliveryRelationship,
  type DeliveryRelationshipChange,
  type DeliveryRelationshipScope,
  deliveryRelationshipAdminCollection,
  deliveryRelationshipCollection,
  deliveryRelationshipId,
  deliveryRelationshipParams,
} from './delivery-relationship.schema'

@Injectable()
export class DeliveryRelationshipService {
  constructor(private readonly database: MongoDatabaseService) {}

  async get(
    actor: AuthenticatedUser,
    scope: DeliveryRelationshipScope,
    relationshipId: string,
  ) {
    await this.requireAdmin(actor, scope)
    const relationship = await this.read(scope, relationshipId)
    return {
      organizationId: relationship?.organizationId ?? null,
      active: relationship?.active === true,
      revision: relationship?.revision ?? 0,
    }
  }

  async set(
    actor: AuthenticatedUser,
    scope: DeliveryRelationshipScope,
    relationshipId: string,
    change: DeliveryRelationshipChange,
  ) {
    await this.requireAdmin(actor, scope)
    const { organizationId, active, expectedRevision } = change
    const revision = expectedRevision + 1
    const _id = deliveryRelationshipId(scope, relationshipId)

    try {
      const result = await this.relationships.updateOne(
        { _id, revision: expectedRevision },
        {
          $set: {
            organizationId,
            active,
            revision,
            updatedBy: actor.id,
            updatedAt: new Date(),
          },
        },
        { upsert: expectedRevision === 0, writeConcern: { w: 'majority' } },
      )
      if (result.matchedCount || result.upsertedCount) {
        return { organizationId, active, revision }
      }
    } catch (error) {
      // Concurrent initial writes compete on the same unique MongoDB key.
      if (
        expectedRevision !== 0 ||
        !(error instanceof MongoServerError && error.code === 11000)
      ) {
        throw error
      }
    }

    throw new ConflictException('Delivery relationship revision conflict')
  }

  // Internal lookup only. Future publication/read services must resolve this
  // again and match its organization and revision, never trust a browser link.
  async findActive(scope: DeliveryRelationshipScope, relationshipId: string) {
    if (
      !this.database.isConfigured ||
      !deliveryRelationshipParams.safeParse({ ...scope, relationshipId })
        .success
    ) {
      return null
    }
    const relationship = await this.read(scope, relationshipId)
    if (
      relationship?._id !== deliveryRelationshipId(scope, relationshipId) ||
      relationship.active !== true ||
      typeof relationship.organizationId !== 'string' ||
      !relationship.organizationId.trim() ||
      !Number.isSafeInteger(relationship.revision) ||
      relationship.revision < 1
    ) {
      return null
    }
    return {
      organizationId: relationship.organizationId,
      revision: relationship.revision,
    }
  }

  private get relationships() {
    return this.database.collection<DeliveryRelationship>(
      deliveryRelationshipCollection,
    )
  }

  private read(scope: DeliveryRelationshipScope, relationshipId: string) {
    return this.relationships.findOne(
      { _id: deliveryRelationshipId(scope, relationshipId) },
      {
        readPreference: 'primary',
        projection: { organizationId: 1, active: 1, revision: 1 },
      },
    )
  }

  private async requireAdmin(
    actor: AuthenticatedUser,
    scope: DeliveryRelationshipScope,
  ) {
    if (!this.database.isConfigured) {
      throw new ServiceUnavailableException(
        'Delivery relationships unavailable',
      )
    }
    const admin = await this.database
      .collection<{
        _id: string
        active: boolean
      }>(deliveryRelationshipAdminCollection)
      .findOne(
        { _id: deliveryRelationshipId(scope, actor.id) },
        { readPreference: 'primary', projection: { active: 1 } },
      )
    if (admin?.active !== true) {
      throw new NotFoundException('Delivery relationship not found')
    }
  }
}
