import { HealthController } from './health.controller'

describe('HealthController', () => {
  const originalMongoUri = process.env.MONGODB_URI

  afterEach(() => {
    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI
    } else {
      process.env.MONGODB_URI = originalMongoUri
    }
  })

  it('reports an operational in-memory API', () => {
    delete process.env.MONGODB_URI

    expect(new HealthController().getHealth()).toEqual({
      status: 'ok',
      persistence: 'memory',
    })
  })

  it('reports MongoDB persistence when configured', () => {
    process.env.MONGODB_URI = 'mongodb://example.test:27017'

    expect(new HealthController().getHealth()).toEqual({
      status: 'ok',
      persistence: 'mongodb',
    })
  })
})
