require('reflect-metadata')

const assert = require('node:assert/strict')
const { NestFactory } = require('@nestjs/core')

const { AppModule } = require('./dist/app.module')
const {
  MongoDatabaseService,
} = require('./dist/database/mongo-database.service')
const {
  DeliveryRelationshipService,
} = require('./dist/delivery/delivery-relationship.service')
const {
  deliveryRelationshipAdminCollection,
  deliveryRelationshipCollection,
  deliveryRelationshipId,
} = require('./dist/delivery/delivery-relationship.schema')
const {
  organizationMembershipAdminCollection,
} = require('./dist/organizations/organization-membership-admin.service')
const {
  organizationMembershipId,
} = require('./dist/organizations/organization-membership.service')

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  try {
    const database = app.get(MongoDatabaseService)
    const service = app.get(DeliveryRelationshipService)
    const admins = database.collection(deliveryRelationshipAdminCollection)
    const relationships = database.collection(deliveryRelationshipCollection)
    const actorId = 'relationship-smoke-admin'
    const scope = {
      workspaceId: 'relationship-smoke-workspace',
      projectId: 'relationship-smoke-project',
      audience: 'customer',
    }
    const relationshipId = 'request-1'
    const change = {
      organizationId: 'customer-organization',
      active: true,
      expectedRevision: 0,
    }
    const token = await tokenFor(actorId)
    const adminId = deliveryRelationshipId(scope, actorId)
    assert.equal((await request(scope, relationshipId)).status, 401)

    // Membership administration does not confer relationship authority.
    await database.collection(organizationMembershipAdminCollection).insertOne({
      _id: organizationMembershipId(
        { ...scope, organizationId: change.organizationId },
        actorId,
      ),
      active: true,
    })
    assert.equal((await request(scope, relationshipId, token)).status, 404)
    assert.equal(
      (await request(scope, relationshipId, token, change)).status,
      404,
    )
    await admins.insertOne({ _id: adminId, active: true })

    const absent = await request(scope, relationshipId, token)
    assert.equal(absent.status, 200)
    assert.equal(absent.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(await absent.json(), {
      organizationId: null,
      active: false,
      revision: 0,
    })
    const initial = await request(scope, relationshipId, token, change)
    assert.equal(initial.status, 200)
    assert.equal(initial.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(await initial.json(), {
      organizationId: change.organizationId,
      active: true,
      revision: 1,
    })
    assert.deepEqual(await service.findActive(scope, relationshipId), {
      organizationId: change.organizationId,
      revision: 1,
    })

    for (const otherScope of [
      { ...scope, workspaceId: 'unrelated-workspace' },
      { ...scope, projectId: 'unrelated-project' },
      { ...scope, audience: 'vendor' },
    ]) {
      assert.equal(
        (await request(otherScope, relationshipId, token)).status,
        404,
      )
      assert.equal(
        (await request(otherScope, relationshipId, token, change)).status,
        404,
      )
      assert.equal(await service.findActive(otherScope, relationshipId), null)
    }
    const otherToken = await tokenFor('unrelated-operator')
    assert.equal((await request(scope, relationshipId, otherToken)).status, 404)
    assert.equal(
      (await request(scope, relationshipId, otherToken, change)).status,
      404,
    )
    for (const invalidChange of [
      { ...change, organizationId: ' ' },
      { ...change, active: 'true' },
      { ...change, expectedRevision: -1 },
      { ...change, updatedBy: 'forged-actor' },
    ]) {
      assert.equal(
        (await request(scope, relationshipId, token, invalidChange)).status,
        400,
      )
    }

    const vendorScope = { ...scope, audience: 'vendor' }
    await admins.insertOne({
      _id: deliveryRelationshipId(vendorScope, actorId),
      active: true,
    })
    assert.equal(
      (
        await request(vendorScope, relationshipId, token, {
          ...change,
          organizationId: 'vendor-organization',
        })
      ).status,
      200,
    )

    // A reassignment and a revocation must be visible on the next lookup.
    const reassigned = await request(scope, relationshipId, token, {
      ...change,
      organizationId: 'new-customer',
      expectedRevision: 1,
    })
    assert.equal(reassigned.status, 200)
    assert.deepEqual(await service.findActive(scope, relationshipId), {
      organizationId: 'new-customer',
      revision: 2,
    })
    assert.equal(
      (await request(scope, relationshipId, token, change)).status,
      409,
    )
    assert.equal(
      (
        await request(scope, relationshipId, token, {
          ...change,
          organizationId: 'new-customer',
          active: false,
          expectedRevision: 2,
        })
      ).status,
      200,
    )
    assert.equal(await service.findActive(scope, relationshipId), null)
    assert.deepEqual(await service.findActive(vendorScope, relationshipId), {
      organizationId: 'vendor-organization',
      revision: 1,
    })

    for (const [id, revision] of [
      ['new-request', 0],
      [relationshipId, 3],
    ]) {
      const writes = await Promise.all([
        request(scope, id, token, { ...change, expectedRevision: revision }),
        request(scope, id, token, {
          ...change,
          active: false,
          expectedRevision: revision,
        }),
      ])
      assert.deepEqual(
        writes.map((response) => response.status).sort(),
        [200, 409],
      )
      const saved = await request(scope, id, token)
      assert.deepEqual(
        await saved.json(),
        await writes.find((response) => response.ok).json(),
      )
    }
    const stored = await relationships.findOne({
      _id: deliveryRelationshipId(scope, relationshipId),
    })
    assert.equal(stored.updatedBy, actorId)
    assert.ok(stored.updatedAt instanceof Date)
    assert.equal(stored.revision, 4)

    await admins.updateOne({ _id: adminId }, { $set: { active: false } })
    assert.equal((await request(scope, relationshipId, token)).status, 404)
    assert.equal(
      (
        await request(scope, relationshipId, token, {
          ...change,
          expectedRevision: 4,
        })
      ).status,
      404,
    )
    console.log('MongoDB delivery relationship checks passed.')
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

function request(scope, relationshipId, token, change) {
  const segments = [
    scope.workspaceId,
    scope.projectId,
    scope.audience,
    relationshipId,
  ].map(encodeURIComponent)
  const url = `http://127.0.0.1:3001/api/admin/workspaces/${segments[0]}/projects/${segments[1]}/${segments[2]}/relationships/${segments[3]}`
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
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
