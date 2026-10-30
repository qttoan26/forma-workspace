import { getApiPort, validateRuntimeConfiguration } from './runtime-config'

describe('runtime configuration', () => {
  describe('getApiPort', () => {
    it('uses the default API port when PORT is omitted', () => {
      expect(getApiPort(undefined)).toBe(3001)
    })

    it('parses a configured port', () => {
      expect(getApiPort('4100')).toBe(4100)
    })

    it.each(['0', '65536', 'invalid', '1.5'])(
      'rejects invalid PORT value %s',
      (value) => {
        expect(() => getApiPort(value)).toThrow(
          'PORT must be an integer between 1 and 65535',
        )
      },
    )
  })

  describe('validateRuntimeConfiguration', () => {
    it('allows lightweight development without MongoDB', () => {
      expect(() =>
        validateRuntimeConfiguration({ NODE_ENV: 'development' }),
      ).not.toThrow()
    })

    it('requires MongoDB in production', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          CORS_ORIGINS: 'https://app.example.com',
        }),
      ).toThrow('MONGODB_URI is required when NODE_ENV=production')
    })

    it('requires an explicit CORS allowlist in production', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://mongo:27017',
        }),
      ).toThrow('CORS_ORIGINS is required when NODE_ENV=production')
    })

    it('accepts a complete production configuration', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          PORT: '3001',
          MONGODB_URI: 'mongodb://mongo:27017',
          CORS_ORIGINS: 'https://app.example.com',
        }),
      ).not.toThrow()
    })
  })
})
