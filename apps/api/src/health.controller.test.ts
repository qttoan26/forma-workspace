import { HealthController } from './health.controller'

describe('HealthController', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl
    }
  })

  it('reports an operational in-memory API', () => {
    delete process.env.DATABASE_URL

    expect(new HealthController().getHealth()).toEqual({
      status: 'ok',
      persistence: 'memory',
    })
  })

  it('reports PostgreSQL persistence when configured', () => {
    process.env.DATABASE_URL = 'postgresql://example.test/forma'

    expect(new HealthController().getHealth()).toEqual({
      status: 'ok',
      persistence: 'postgresql',
    })
  })
})
