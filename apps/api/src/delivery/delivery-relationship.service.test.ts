import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { type Collection, type Document, MongoServerError } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MongoDatabaseService } from '../database/mongo-database.service'
import { DeliveryRelationshipController } from './delivery-relationship.controller'
import {
  deliveryRelationshipAdminCollection,
  deliveryRelationshipCollection,
  deliveryRelationshipId,
  type DeliveryRelationshipScope,
} from './delivery-relationship.schema'
import { DeliveryRelationshipService } from './delivery-relationship.service'

const actor = { id: 'operator-1' }
const scope: DeliveryRelationshipScope = {
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  audience: 'customer',
}
const params = { ...scope, relationshipId: 'request-1' }
const change = {
  organizationId: 'organization-1',
  active: true,
  expectedRevision: 0,
}
const record = {
  _id: deliveryRelationshipId(scope, params.relationshipId),
  organizationId: change.organizationId,
  active: true,
  revision: 1,
}

describe('Delivery relationships', () => {
  const findAdmin = vi.fn()
  const findRelationship = vi.fn()
  const updateOne = vi.fn()
  let database: MongoDatabaseService
  let service: DeliveryRelationshipService
  let controller: DeliveryRelationshipController

  beforeEach(() => {
    vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')
    database = new MongoDatabaseService()
    vi.spyOn(database, 'collection').mockImplementation(
      <TSchema extends Document>(name: string) => {
        if (name === deliveryRelationshipAdminCollection) {
          return { findOne: findAdmin } as unknown as Collection<TSchema>
        }
        expect(name).toBe(deliveryRelationshipCollection)
        return {
          findOne: findRelationship,
          updateOne,
        } as unknown as Collection<TSchema>
      },
    )
    findAdmin.mockResolvedValue({ active: true })
    findRelationship.mockResolvedValue(record)
    updateOne.mockResolvedValue({ matchedCount: 1, upsertedCount: 0 })
    service = new DeliveryRelationshipService(database)
    controller = new DeliveryRelationshipController(service)
  })

  afterEach(async () => {
    await database.onModuleDestroy()
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  it('reads only the relationship snapshot after checking separate scoped authority', async () => {
    await expect(controller.get(params, actor)).resolves.toEqual({
      organizationId: change.organizationId,
      active: true,
      revision: 1,
    })
    expect(findAdmin).toHaveBeenCalledWith(
      { _id: deliveryRelationshipId(scope, actor.id) },
      { readPreference: 'primary', projection: { active: 1 } },
    )
    expect(findRelationship).toHaveBeenCalledWith(
      { _id: record._id },
      {
        readPreference: 'primary',
        projection: { organizationId: 1, active: 1, revision: 1 },
      },
    )
  })

  it('starts an absent relationship disabled at revision zero', async () => {
    findRelationship.mockResolvedValue(null)
    await expect(controller.get(params, actor)).resolves.toEqual({
      organizationId: null,
      active: false,
      revision: 0,
    })
    await expect(
      service.findActive(scope, params.relationshipId),
    ).resolves.toBeNull()
  })

  it.each([null, { active: false }, { active: [true] }])(
    'denies reads and writes without active relationship administration (%j)',
    async (admin) => {
      findAdmin.mockResolvedValue(admin)
      await expect(controller.get(params, actor)).rejects.toThrow(
        NotFoundException,
      )
      await expect(controller.set(params, change, actor)).rejects.toThrow(
        NotFoundException,
      )
      expect(findRelationship).not.toHaveBeenCalled()
      expect(updateOne).not.toHaveBeenCalled()
    },
  )

  it('keeps authority and records separate across workspace, project and audience', async () => {
    findAdmin.mockImplementation(({ _id }: { _id: string }) =>
      Promise.resolve(
        _id === deliveryRelationshipId(scope, actor.id)
          ? { active: true }
          : null,
      ),
    )
    findRelationship.mockImplementation(({ _id }: { _id: string }) =>
      Promise.resolve(_id === record._id ? record : null),
    )
    for (const differentScope of [
      { ...scope, workspaceId: 'other-workspace' },
      { ...scope, projectId: 'other-project' },
      { ...scope, audience: 'vendor' as const },
    ]) {
      await expect(
        service.get(actor, differentScope, params.relationshipId),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.set(actor, differentScope, params.relationshipId, change),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.findActive(differentScope, params.relationshipId),
      ).resolves.toBeNull()
    }
    await expect(
      service.get({ id: 'other-operator' }, scope, params.relationshipId),
    ).rejects.toThrow(NotFoundException)
    expect(updateOne).not.toHaveBeenCalled()
  })

  it('uses an atomic revision check and records the authenticated actor on reassignment', async () => {
    const reassignment = {
      ...change,
      organizationId: 'organization-2',
      expectedRevision: 3,
    }
    await expect(controller.set(params, reassignment, actor)).resolves.toEqual({
      organizationId: 'organization-2',
      active: true,
      revision: 4,
    })
    expect(updateOne).toHaveBeenCalledWith(
      { _id: record._id, revision: 3 },
      {
        $set: {
          organizationId: 'organization-2',
          active: true,
          revision: 4,
          updatedBy: actor.id,
          updatedAt: expect.any(Date) as Date,
        },
      },
      { upsert: false, writeConcern: { w: 'majority' } },
    )
  })

  it('rejects both stale updates and competing initial creation', async () => {
    updateOne
      .mockResolvedValueOnce({ matchedCount: 0, upsertedCount: 0 })
      .mockRejectedValueOnce(
        new MongoServerError({ code: 11000, message: 'duplicate key' }),
      )
    await expect(
      controller.set(params, { ...change, expectedRevision: 1 }, actor),
    ).rejects.toThrow(ConflictException)
    await expect(controller.set(params, change, actor)).rejects.toThrow(
      ConflictException,
    )
  })

  it('does not cache the previous organization or a revoked relationship', async () => {
    findRelationship
      .mockResolvedValueOnce(record)
      .mockResolvedValueOnce({
        ...record,
        organizationId: 'organization-2',
        revision: 2,
      })
      .mockResolvedValueOnce({ ...record, active: false, revision: 3 })
    await expect(
      service.findActive(scope, params.relationshipId),
    ).resolves.toEqual({ organizationId: 'organization-1', revision: 1 })
    await expect(
      service.findActive(scope, params.relationshipId),
    ).resolves.toEqual({ organizationId: 'organization-2', revision: 2 })
    await expect(
      service.findActive(scope, params.relationshipId),
    ).resolves.toBeNull()
  })

  it.each([
    { ...record, _id: 'other-record' },
    { ...record, active: [true] },
    { ...record, organizationId: ' ' },
    { ...record, revision: 0 },
    { ...record, revision: 1.5 },
  ])('does not resolve malformed active records (%j)', async (relationship) => {
    findRelationship.mockResolvedValue(relationship)
    await expect(
      service.findActive(scope, params.relationshipId),
    ).resolves.toBeNull()
  })

  it('fails closed without a configured database and reports operational failures', async () => {
    vi.stubEnv('MONGODB_URI', undefined)
    const unconfigured = new MongoDatabaseService()
    const unavailable = new DeliveryRelationshipService(unconfigured)
    await expect(
      unavailable.get(actor, scope, params.relationshipId),
    ).rejects.toThrow(ServiceUnavailableException)
    await expect(
      unavailable.set(actor, scope, params.relationshipId, change),
    ).rejects.toThrow(ServiceUnavailableException)
    await expect(
      unavailable.findActive(scope, params.relationshipId),
    ).resolves.toBeNull()
    await unconfigured.onModuleDestroy()
    findRelationship.mockRejectedValue(new Error('database unavailable'))
    await expect(
      service.findActive(scope, params.relationshipId),
    ).rejects.toThrow('database unavailable')
    updateOne.mockRejectedValue(new Error('write unavailable'))
    await expect(controller.set(params, change, actor)).rejects.toThrow(
      'write unavailable',
    )
  })

  it.each([
    { ...change, active: 'true' },
    { ...change, organizationId: '' },
    { ...change, organizationId: ' ' },
    { ...change, expectedRevision: -1 },
    { ...change, expectedRevision: 0.5 },
    { ...change, expectedRevision: Number.MAX_SAFE_INTEGER },
    { ...change, updatedBy: 'forged-operator' },
    { organizationId: 'organization-1', expectedRevision: 0 },
  ])('rejects invalid or forged input before writing (%j)', (body) => {
    expect(() => controller.set(params, body, actor)).toThrow(
      BadRequestException,
    )
    expect(updateOne).not.toHaveBeenCalled()
  })

  it.each([
    { ...params, workspaceId: ' ' },
    { ...params, projectId: '' },
    { ...params, audience: 'internal' },
    { ...params, relationshipId: 'x'.repeat(257) },
  ])('rejects incomplete or invalid scope (%j)', (invalidParams) => {
    expect(() => controller.get(invalidParams, actor)).toThrow(
      BadRequestException,
    )
    expect(() => controller.set(invalidParams, change, actor)).toThrow(
      BadRequestException,
    )
    expect(findAdmin).not.toHaveBeenCalled()
  })
})
