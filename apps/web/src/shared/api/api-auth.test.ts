import { afterEach, describe, expect, it } from 'vitest'

import {
  configureApiAccessTokenProvider,
  getApiAuthorizationHeader,
} from './api-auth'

let resetAccessTokenProvider: (() => void) | undefined

afterEach(() => {
  resetAccessTokenProvider?.()
  resetAccessTokenProvider = undefined
})

describe('API auth token boundary', () => {
  it('is anonymous by default', async () => {
    await expect(getApiAuthorizationHeader()).resolves.toBeUndefined()
  })

  it('supports async session token providers and trims the token', async () => {
    resetAccessTokenProvider = configureApiAccessTokenProvider(
      async () => '  access-token  ',
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
})
