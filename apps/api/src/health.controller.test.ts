import { ServiceUnavailableException } from '@nestjs/common'

import type { MongoDatabaseService } from './database/mongo-database.service'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('reports an operational in-memory API', () => {
    const controller = new HealthController(createDatabase(false, true))

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      persistence: 'memory',
    })
  })

  it('reports MongoDB persistence when configured', () => {
    const controller = new HealthController(createDatabase(true, true))

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      persistence: 'mongodb',
    })
  })

  it('reports readiness when MongoDB responds to ping', async () => {
    const controller = new HealthController(createDatabase(true, true))

    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'ready',
      persistence: 'mongodb',
    })
  })

  it('reports readiness for the in-memory development fallback', async () => {
    const controller = new HealthController(createDatabase(false, true))

    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'ready',
      persistence: 'memory',
    })
  })

  it('returns service unavailable when MongoDB cannot be reached', async () => {
    const controller = new HealthController(createDatabase(true, false))

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    )
  })
})

function createDatabase(
  isConfigured: boolean,
  pingResult: boolean,
): MongoDatabaseService {
  return {
    isConfigured,
    ping: () => Promise.resolve(pingResult),
  } as unknown as MongoDatabaseService
}
