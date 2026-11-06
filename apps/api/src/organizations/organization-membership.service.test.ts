import type { Collection } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MongoDatabaseService } from '../database/mongo-database.service'
import {
  type OrganizationScope,
  OrganizationMembershipService,
} from './organization-membership.service'

const user = { id: 'account-1' }
const scope: OrganizationScope = {
  workspaceId: 'workspace-1',
  organizationId: 'organization-1',
  audience: 'customer',
}
const membership = {
  _id: '["workspace-1","organization-1","customer","account-1"]',
  state: 'active',
  deliveryRead: true,
}

describe('OrganizationMembershipService', () => {
  const findOne = vi.fn()
  let database: MongoDatabaseService
  let service: OrganizationMembershipService

  beforeEach(() => {
    vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')
    database = new MongoDatabaseService()
    vi.spyOn(database, 'collection').mockReturnValue({
      findOne,
    } as unknown as Collection)
    service = new OrganizationMembershipService(database)
  })

  afterEach(async () => {
    await database.onModuleDestroy()
    findOne.mockReset()
    vi.unstubAllEnvs()
  })

  it('reads current permission for the exact account, workspace, organization and audience', async () => {
    findOne
      .mockResolvedValueOnce(membership)
      .mockResolvedValueOnce({ ...membership, state: 'revoked' })

    await expect(service.canReadDelivery(user, scope)).resolves.toBe(true)
    await expect(service.canReadDelivery(user, scope)).resolves.toBe(false)

    expect(findOne).toHaveBeenCalledTimes(2)
    expect(findOne).toHaveBeenLastCalledWith(
      { _id: membership._id },
      { readPreference: 'primary', projection: { state: 1, deliveryRead: 1 } },
    )
  })

  it.each([
    ['a missing membership', null],
    ['an inactive membership', { ...membership, state: 'inactive' }],
    ['a membership without permission', { ...membership, deliveryRead: false }],
    ['a malformed permission', { ...membership, deliveryRead: [true] }],
    ['an unexpected membership key', { ...membership, _id: 'another-key' }],
  ])('denies %s', async (_label, record) => {
    findOne.mockResolvedValue(record)

    await expect(service.canReadDelivery(user, scope)).resolves.toBe(false)
  })

  it('denies incomplete scope and missing MongoDB configuration', async () => {
    vi.stubEnv('MONGODB_URI', undefined)
    const unconfiguredService = new OrganizationMembershipService(
      new MongoDatabaseService(),
    )

    await expect(
      service.canReadDelivery(user, { ...scope, workspaceId: '' }),
    ).resolves.toBe(false)
    await expect(
      unconfiguredService.canReadDelivery(user, scope),
    ).resolves.toBe(false)
    expect(findOne).not.toHaveBeenCalled()
  })

  it('reports a database read failure to the caller', async () => {
    findOne.mockRejectedValue(new Error('database unavailable'))

    await expect(service.canReadDelivery(user, scope)).rejects.toThrow(
      'database unavailable',
    )
  })
})
