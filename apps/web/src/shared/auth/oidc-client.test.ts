import { afterEach, describe, expect, it, vi } from 'vitest'

import { getApiAuthorizationHeader } from '@/shared/api/api-auth'

import {
  completeOidcLogin,
  initializeOidcAccessTokenProvider,
} from './oidc-client'

const transactionKey = 'forma.oidc.transaction'
const sessionKey = 'forma.oidc.session'

function configureOidcEnv() {
  vi.stubEnv('VITE_OIDC_AUTHORIZATION_ENDPOINT', 'https://id.example.test/authorize')
  vi.stubEnv('VITE_OIDC_TOKEN_ENDPOINT', 'https://id.example.test/token')
  vi.stubEnv('VITE_OIDC_CLIENT_ID', 'forma-web')
  vi.stubEnv('VITE_OIDC_REDIRECT_URI', 'https://app.example.test/auth/callback')
}

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('OIDC PKCE client', () => {
  it('exchanges a validated callback code and exposes the access token', async () => {
    configureOidcEnv()
    sessionStorage.setItem(
      transactionKey,
      JSON.stringify({ state: 'state-123', codeVerifier: 'verifier-123' }),
    )

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'access-123', expires_in: 3600 }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      completeOidcLogin(
        'https://app.example.test/auth/callback?code=code-123&state=state-123',
      ),
    ).resolves.toMatchObject({ accessToken: 'access-123' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(request.method).toBe('POST')
    expect(request.body).toBeInstanceOf(URLSearchParams)
    if (!(request.body instanceof URLSearchParams)) {
      throw new Error('Expected token request body to be URLSearchParams')
    }
    expect(request.body.get('code_verifier')).toBe('verifier-123')
    expect(sessionStorage.getItem(transactionKey)).toBeNull()
    expect(sessionStorage.getItem(sessionKey)).toContain('access-123')

    const resetProvider = initializeOidcAccessTokenProvider()
    await expect(getApiAuthorizationHeader()).resolves.toEqual({
      Authorization: 'Bearer access-123',
    })
    resetProvider()
  })

  it('rejects a callback whose state does not match the login transaction', async () => {
    configureOidcEnv()
    sessionStorage.setItem(
      transactionKey,
      JSON.stringify({ state: 'expected-state', codeVerifier: 'verifier-123' }),
    )
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      completeOidcLogin(
        'https://app.example.test/auth/callback?code=code-123&state=wrong-state',
      ),
    ).rejects.toThrow('OIDC state validation failed')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not expose an expired stored access token', async () => {
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({ accessToken: 'expired-token', expiresAt: Date.now() - 1 }),
    )

    const resetProvider = initializeOidcAccessTokenProvider()
    await expect(getApiAuthorizationHeader()).resolves.toBeUndefined()
    expect(sessionStorage.getItem(sessionKey)).toBeNull()
    resetProvider()
  })
})
