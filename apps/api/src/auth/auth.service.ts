import { Injectable, UnauthorizedException } from '@nestjs/common'
import { createRemoteJWKSet, jwtVerify } from 'jose'

import type { AuthenticatedUser } from './auth.types'

const LOCAL_DEVELOPMENT_USER_ID = 'local-development-user'

@Injectable()
export class AuthService {
  private readonly issuer = process.env.AUTH_ISSUER?.trim()
  private readonly audience = process.env.AUTH_AUDIENCE?.trim()
  private readonly jwksUrl = process.env.AUTH_JWKS_URL?.trim()
  private readonly jwtSecret = process.env.AUTH_JWT_SECRET?.trim()
  private readonly remoteJwks = this.jwksUrl
    ? createRemoteJWKSet(new URL(this.jwksUrl))
    : null
  private readonly sharedSecret = this.jwtSecret
    ? new TextEncoder().encode(this.jwtSecret)
    : null

  async authenticate(
    authorizationHeader?: string | string[],
  ): Promise<AuthenticatedUser> {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication is not configured')
      }

      return {
        id: process.env.AUTH_DEV_USER_ID?.trim() || LOCAL_DEVELOPMENT_USER_ID,
      }
    }

    const token = getBearerToken(authorizationHeader)
    if (!token) {
      throw new UnauthorizedException('Bearer token is required')
    }

    try {
      const verification = this.sharedSecret
        ? await jwtVerify(token, this.sharedSecret, {
            issuer: this.issuer,
            audience: this.audience,
            algorithms: ['HS256'],
          })
        : await jwtVerify(token, this.remoteJwks!, {
            issuer: this.issuer,
            audience: this.audience,
          })

      const subject = verification.payload.sub?.trim()
      if (!subject) {
        throw new Error('JWT subject is missing')
      }

      return { id: subject }
    } catch {
      throw new UnauthorizedException('Invalid or expired bearer token')
    }
  }

  private isConfigured() {
    return Boolean(
      this.issuer &&
        this.audience &&
        (this.remoteJwks !== null || this.sharedSecret !== null),
    )
  }
}

function getBearerToken(header?: string | string[]) {
  if (typeof header !== 'string') return undefined

  const [scheme, token, ...extraParts] = header.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
    return undefined
  }

  return token
}
