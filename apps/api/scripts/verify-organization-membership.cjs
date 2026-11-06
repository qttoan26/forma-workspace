require('reflect-metadata')

const assert = require('node:assert/strict')
const { NestFactory } = require('@nestjs/core')

const { AppModule } = require('./dist/app.module')
const {
  MongoDatabaseService,
} = require('./dist/database/mongo-database.service')
const {
  OrganizationMembershipService,
  organizationMembershipCollection,
  organizationMembershipId,
} = require('./dist/organizations/organization-membership.service')

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })

  try {
    const service = app.get(OrganizationMembershipService)
    const memberships = app
      .get(MongoDatabaseService)
      .collection(organizationMembershipCollection)
    const user = { id: 'membership-smoke-account' }
    const scope = {
      workspaceId: 'membership-smoke-workspace',
      organizationId: 'membership-smoke-organization',
      audience: 'customer',
    }
    const _id = organizationMembershipId(scope, user.id)

    assert.equal(await service.canReadDelivery(user, scope), false)
    await memberships.insertOne({ _id, state: 'active', deliveryRead: false })
    assert.equal(await service.canReadDelivery(user, scope), false)

    await memberships.updateOne({ _id }, { $set: { deliveryRead: true } })
    assert.equal(await service.canReadDelivery(user, scope), true)

    for (const differentScope of [
      { ...scope, workspaceId: 'unrelated-workspace' },
      { ...scope, organizationId: 'unrelated-organization' },
      { ...scope, audience: 'vendor' },
    ]) {
      assert.equal(await service.canReadDelivery(user, differentScope), false)
    }
    assert.equal(
      await service.canReadDelivery({ id: 'unrelated-account' }, scope),
      false,
    )

    const vendorScope = { ...scope, audience: 'vendor' }
    await memberships.insertOne({
      _id: organizationMembershipId(vendorScope, user.id),
      state: 'active',
      deliveryRead: true,
    })

    await memberships.updateOne({ _id }, { $set: { state: 'revoked' } })
    assert.equal(await service.canReadDelivery(user, scope), false)
    assert.equal(await service.canReadDelivery(user, vendorScope), true)

    console.log('MongoDB membership checks passed.')
  } finally {
    await app.close()
  }
}

verify().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
