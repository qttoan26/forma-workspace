require('reflect-metadata')

const assert = require('node:assert/strict')
const { NestFactory } = require('@nestjs/core')

const { AppModule } = require('./dist/app.module')
const {
  MongoDatabaseService,
} = require('./dist/database/mongo-database.service')
const {
  organizationMembershipAdminCollection,
} = require('./dist/organizations/organization-membership-admin.service')
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
    const database = app.get(MongoDatabaseService)
    const memberships = database.collection(organizationMembershipCollection)
    const admins = database.collection(organizationMembershipAdminCollection)
    const user = { id: 'membership-smoke-account' }
    const admin = { id: 'membership-smoke-admin' }
    const scope = {
      workspaceId: 'membership-smoke-workspace',
      organizationId: 'membership-smoke-organization',
      audience: 'customer',
    }
    const _id = organizationMembershipId(scope, user.id)

    assert.equal(await service.canReadDelivery(user, scope), false)
    await memberships.insertOne({ _id, state: 'active', deliveryRead: false })
    assert.equal(await service.canReadDelivery(user, scope), false)

    const adminId = organizationMembershipId(scope, admin.id)
    const adminToken = await tokenFor(admin.id)
    const userToken = await tokenFor(user.id)
    const grant = { deliveryRead: true, expectedRevision: 0 }
    assert.equal((await requestAccess(scope, user.id)).status, 401)
    assert.equal(
      (await requestAccess(scope, user.id, adminToken, grant)).status,
      404,
    )
    await admins.insertOne({ _id: adminId, active: true })

    assert.equal(
      (await requestAccess(scope, user.id, userToken, grant)).status,
      404,
    )
    assert.equal(
      (
        await requestAccess(
          { ...scope, workspaceId: 'unrelated-workspace' },
          user.id,
          adminToken,
          grant,
        )
      ).status,
      404,
    )
    const legacy = await requestAccess(scope, user.id, adminToken)
    assert.equal(legacy.status, 200)
    assert.equal(legacy.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(await legacy.json(), { deliveryRead: false, revision: 0 })

    const granted = await requestAccess(scope, user.id, adminToken, grant)
    assert.equal(granted.status, 200)
    assert.deepEqual(await granted.json(), { deliveryRead: true, revision: 1 })
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

    assert.equal(
      (await requestAccess(vendorScope, user.id, adminToken, grant)).status,
      404,
    )
    const revoked = await requestAccess(scope, user.id, adminToken, {
      deliveryRead: false,
      expectedRevision: 1,
    })
    assert.equal(revoked.status, 200)
    assert.deepEqual(await revoked.json(), { deliveryRead: false, revision: 2 })
    assert.equal(
      (await requestAccess(scope, user.id, adminToken, grant)).status,
      409,
    )
    assert.equal(await service.canReadDelivery(user, scope), false)
    assert.equal(await service.canReadDelivery(user, vendorScope), true)
    const current = await memberships.findOne({ _id })
    assert.equal(current.state, 'revoked')
    assert.equal(current.updatedBy, admin.id)
    assert.ok(current.updatedAt instanceof Date)

    const newAccount = 'membership-smoke-new-account'
    const competingWrites = await Promise.all([
      requestAccess(scope, newAccount, adminToken, grant),
      requestAccess(scope, newAccount, adminToken, {
        ...grant,
        deliveryRead: false,
      }),
    ])
    assert.deepEqual(
      competingWrites.map((response) => response.status).sort(),
      [200, 409],
    )
    const winningWrite = competingWrites.find((response) => response.ok)
    const persistedAccess = await requestAccess(scope, newAccount, adminToken)
    assert.deepEqual(await persistedAccess.json(), await winningWrite.json())

    await admins.updateOne({ _id: adminId }, { $set: { active: false } })
    assert.equal((await requestAccess(scope, user.id, adminToken)).status, 404)
    assert.equal(
      (
        await requestAccess(scope, user.id, adminToken, {
          ...grant,
          expectedRevision: 2,
        })
      ).status,
      404,
    )
    assert.equal(await service.canReadDelivery(user, scope), false)

    console.log('MongoDB membership checks passed.')
  } finally {
    await app.close()
  }
}

async function tokenFor(accountId) {
  const { SignJWT } = await import('jose')
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(accountId)
    .setIssuer(process.env.AUTH_ISSUER)
    .setAudience(process.env.AUTH_AUDIENCE)
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.AUTH_JWT_SECRET))
}

function requestAccess(scope, accountId, token, change) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const url =
    `http://127.0.0.1:3001/api/admin/workspaces/${scope.workspaceId}` +
    `/organizations/${scope.organizationId}/${scope.audience}/memberships/${accountId}/delivery-access`

  if (!change) return fetch(url, { headers })
  return fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(change),
  })
}

verify().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
