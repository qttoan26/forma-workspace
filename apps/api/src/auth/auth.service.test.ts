// @vitest-environment node

import { createServer, type Server } from 'node:http'

import { UnauthorizedException } from '@nestjs/common'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'

import { AuthService } from './auth.service'

const AUTH_ENV_KEYS = [
  'NODE_ENV',
  'AUTH_ISSUER',
  'AUTH_AUDIENCE',
  'AUTH_JWKS_URL',
  'AUTH_JWT_SECRET',
  'AUTH_DEV_USER_ID',
] as const

const originalEnvironment = Object.fromEntries(
  AUTH_ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof AUTH_ENV_KEYS)[number], string | undefined>

afterEach(() => {
  for (const key of AUTH_ENV_KEYS) {
    const value = originalEnvironment[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('AuthService', () => {
  it('uses a stable local user when auth is not configured outside production', async () => {
    clearAuthEnvironment()
    process.env.NODE_ENV = 'development'

    await expect(new AuthService().authenticate()).resolves.toEqual({
      id: 'local-development-user',
    })
  })

  it('uses the configured local development user id', async () => {
    clearAuthEnvironment()
    process.env.NODE_ENV = 'development'
    process.env.AUTH_DEV_USER_ID = 'developer-1'

    await expect(new AuthService().authenticate()).resolves.toEqual({
      id: 'developer-1',
    })
  })

  it('verifies an HMAC bearer token and returns its subject', async () => {
    const secret = configureHmacAuth()
    const token = await createToken(secret, 'user-123')

    await expect(
      new AuthService().authenticate(`Bearer ${token}`),
    ).resolves.toEqual({ id: 'user-123' })
  })

  it('verifies an RS256 bearer token through a remote JWKS endpoint', async () => {
    clearAuthEnvironment()
    process.env.NODE_ENV = 'test'
    process.env.AUTH_ISSUER = 'https://issuer.example.com'
    process.env.AUTH_AUDIENCE = 'forma-api'

    const { privateKey, publicKey } = await generateKeyPair('RS256')
    const publicJwk = await exportJWK(publicKey)
    publicJwk.kid = 'remote-key-1'
    publicJwk.alg = 'RS256'
    publicJwk.use = 'sig'

    const jwksServer = await startJwksServer({ keys: [publicJwk] })
    process.env.AUTH_JWKS_URL = jwksServer.url

    try {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: publicJwk.kid })
        .setSubject('remote-user-123')
        .setIssuer(process.env.AUTH_ISSUER)
        .setAudience(process.env.AUTH_AUDIENCE)
        .setExpirationTime('5m')
        .sign(privateKey)

      await expect(
        new AuthService().authenticate(`Bearer ${token}`),
      ).resolves.toEqual({ id: 'remote-user-123' })
    } finally {
      await jwksServer.close()
    }
  })

  it('rejects requests without a bearer token when auth is configured', async () => {
    configureHmacAuth()

    await expect(new AuthService().authenticate()).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('rejects a token issued for a different audience', async () => {
    const secret = configureHmacAuth()
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-123')
      .setIssuer('https://issuer.example.com')
      .setAudience('another-api')
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(secret))

    await expect(
      new AuthService().authenticate(`Bearer ${token}`),
    ).rejects.toThrow(UnauthorizedException)
  })
})

function clearAuthEnvironment() {
  delete process.env.AUTH_ISSUER
  delete process.env.AUTH_AUDIENCE
  delete process.env.AUTH_JWKS_URL
  delete process.env.AUTH_JWT_SECRET
  delete process.env.AUTH_DEV_USER_ID
}

function configureHmacAuth() {
  clearAuthEnvironment()
  const secret = 'forma-auth-smoke-secret-32-characters-long'
  process.env.NODE_ENV = 'test'
  process.env.AUTH_ISSUER = 'https://issuer.example.com'
  process.env.AUTH_AUDIENCE = 'forma-api'
  process.env.AUTH_JWT_SECRET = secret
  return secret
}

function createToken(secret: string, subject: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setIssuer('https://issuer.example.com')
    .setAudience('forma-api')
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(secret))
}

async function startJwksServer(jwks: object) {
  const server = createServer((request, response) => {
    if (request.url !== '/.well-known/jwks.json') {
      response.statusCode = 404
      response.end()
      return
    }

    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(jwks))
  })

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error)
    server.once('error', onError)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', onError)
      resolve()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server)
    throw new Error('JWKS test server did not expose a TCP port')
  }

  return {
    url: `http://127.0.0.1:${address.port}/.well-known/jwks.json`,
    close: () => closeServer(server),
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
