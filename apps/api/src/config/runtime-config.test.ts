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
    it('allows lightweight development without MongoDB or auth', () => {
      expect(() =>
        validateRuntimeConfiguration({ NODE_ENV: 'development' }),
      ).not.toThrow()
    })

    it('rejects partial auth configuration', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'development',
          AUTH_ISSUER: 'https://issuer.example.com',
        }),
      ).toThrow('AUTH_AUDIENCE is required when authentication is enabled')
    })

    it('rejects ambiguous auth verifier configuration', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'development',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWKS_URL: 'http://localhost:9000/.well-known/jwks.json',
          AUTH_JWT_SECRET: 'a'.repeat(32),
        }),
      ).toThrow('Configure exactly one of AUTH_JWKS_URL or AUTH_JWT_SECRET')
    })

    it('rejects short HMAC secrets', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'development',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWT_SECRET: 'too-short',
        }),
      ).toThrow('AUTH_JWT_SECRET must be at least 32 characters')
    })

    it('requires MongoDB in production', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          CORS_ORIGINS: 'https://app.example.com',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWT_SECRET: 'a'.repeat(32),
        }),
      ).toThrow('MONGODB_URI is required when NODE_ENV=production')
    })

    it('requires an explicit CORS allowlist in production', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://mongo:27017',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWT_SECRET: 'a'.repeat(32),
        }),
      ).toThrow('CORS_ORIGINS is required when NODE_ENV=production')
    })

    it('requires authentication in production', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://mongo:27017',
          CORS_ORIGINS: 'https://app.example.com',
        }),
      ).toThrow('AUTH_ISSUER is required when authentication is enabled')
    })

    it('requires HTTPS for production JWKS', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://mongo:27017',
          CORS_ORIGINS: 'https://app.example.com',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWKS_URL: 'http://issuer.example.com/.well-known/jwks.json',
        }),
      ).toThrow('AUTH_JWKS_URL must use HTTPS in production')
    })

    it('accepts a complete production configuration with an HMAC verifier', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          PORT: '3001',
          MONGODB_URI: 'mongodb://mongo:27017',
          CORS_ORIGINS: 'https://app.example.com',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWT_SECRET: 'a'.repeat(32),
        }),
      ).not.toThrow()
    })

    it('accepts a complete production configuration with remote JWKS', () => {
      expect(() =>
        validateRuntimeConfiguration({
          NODE_ENV: 'production',
          PORT: '3001',
          MONGODB_URI: 'mongodb://mongo:27017',
          CORS_ORIGINS: 'https://app.example.com',
          AUTH_ISSUER: 'https://issuer.example.com',
          AUTH_AUDIENCE: 'forma-api',
          AUTH_JWKS_URL: 'https://issuer.example.com/.well-known/jwks.json',
        }),
      ).not.toThrow()
    })
  })
})
