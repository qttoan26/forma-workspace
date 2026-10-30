import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  configureApiAccessTokenProvider,
  configureApiUnauthorizedHandler,
  getApiAuthorizationHeader,
  handleApiUnauthorizedResponse,
} from './api-auth'

let resetAccessTokenProvider: (() => void) | undefined
let resetUnauthorizedHandler: (() => void) | undefined

afterEach(() => {
  resetAccessTokenProvider?.()
  resetAccessTokenProvider = undefined
  resetUnauthorizedHandler?.()
  resetUnauthorizedHandler = undefined
})

describe('API auth token boundary', () => {
  it('is anonymous by default', async () => {
    await expect(getApiAuthorizationHeader()).resolves.toBeUndefined()
  })

  it('supports async session token providers and trims the token', async () => {
    resetAccessTokenProvider = configureApiAccessTokenProvider(() =>
      Promise.resolve('  access-token  '),
    )

    await expect(getApiAuthorizationHeader()).resolves.toEqual({
      Authorization: 'Bearer access-token',
    })
  })

  it('restores anonymous behavior when the provider is disposed', async () => {
    const dispose = configureApiAccessTokenProvider(() => 'access-token')
    dispose()

    await expect(getApiAuthorizationHeader()).resolves.toBeUndefined()
  })

  it('runs the configured unauthorized handler only for 401 responses', () => {
    const handler = vi.fn()
    resetUnauthorizedHandler = configureApiUnauthorizedHandler(handler)

    expect(handleApiUnauthorizedResponse(new Response(null, { status: 401 }))).toBe(
      true,
    )
    expect(handleApiUnauthorizedResponse(new Response(null, { status: 403 }))).toBe(
      false,
    )
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
