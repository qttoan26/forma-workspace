import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureApiAccessTokenProvider } from '@/shared/api/api-auth'

import { loadAuthSession } from './auth-session'

let resetAccessTokenProvider: (() => void) | undefined

afterEach(() => {
  resetAccessTokenProvider?.()
  resetAccessTokenProvider = undefined
  vi.unstubAllGlobals()
})

describe('auth session', () => {
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
})
