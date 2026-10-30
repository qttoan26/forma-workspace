import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureApiAccessTokenProvider } from '@/shared/api/api-auth'

import { clearAuthSession, getLocalLoginUrl, loadAuthSession } from './auth-session'

let resetAccessTokenProvider: (() => void) | undefined

afterEach(() => {
  resetAccessTokenProvider?.()
  resetAccessTokenProvider = undefined
  sessionStorage.clear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('auth session', () => {
  it('loads a local demo user without calling the API in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadAuthSession()).resolves.toEqual({
      user: { id: 'demo-user' },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads the authenticated user with the configured bearer token', async () => {
    resetAccessTokenProvider = configureApiAccessTokenProvider(
      () => 'token-123',
    )
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'user-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadAuthSession('https://api.example.test')).resolves.toEqual({
      user: { id: 'user-123' },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/me',
      { headers: { Authorization: 'Bearer token-123' } },
    )
  })

  it('returns null when the API rejects the session', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loadAuthSession('https://api.example.test'),
    ).resolves.toBeNull()
  })

  it('builds the local login route from the Vite base path', () => {
    vi.stubEnv('BASE_URL', '/forma-workspace/')

    expect(getLocalLoginUrl()).toBe('/forma-workspace/login')
  })

  it('clears stored OIDC session and transaction state', () => {
    sessionStorage.setItem('forma.oidc.session', 'stored-session')
    sessionStorage.setItem('forma.oidc.transaction', 'stored-transaction')

    clearAuthSession()

    expect(sessionStorage.getItem('forma.oidc.session')).toBeNull()
    expect(sessionStorage.getItem('forma.oidc.transaction')).toBeNull()
  })
})
