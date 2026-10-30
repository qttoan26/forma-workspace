import { afterEach, describe, expect, it } from 'vitest'

import {
  getFrontendAccessToken,
  getFrontendAuthStorageScope,
  getFrontendAuthSubject,
  resetFrontendAuthSessionProvider,
  setFrontendAuthSessionProvider,
} from './auth-session'

afterEach(() => {
  resetFrontendAuthSessionProvider()
})

describe('frontend auth session', () => {
  it('uses the backend development subject when no provider is registered', async () => {
    expect(getFrontendAuthSubject()).toBe('local-development-user')
    expect(getFrontendAuthStorageScope()).toBe('local-development-user')
    await expect(getFrontendAccessToken()).resolves.toBeNull()
  })

  it('uses an anonymous scope while a registered provider has no user', async () => {
    setFrontendAuthSessionProvider({
      getSubject: () => null,
      getAccessToken: () => null,
    })

    expect(getFrontendAuthSubject()).toBe('anonymous')
    expect(getFrontendAuthStorageScope()).toBe('anonymous')
    await expect(getFrontendAccessToken()).resolves.toBeNull()
  })

  it('exposes a provider subject and token without persisting either', async () => {
    setFrontendAuthSessionProvider({
      getSubject: () => 'user@example.com',
      getAccessToken: async () => ' access-token ',
    })

    expect(getFrontendAuthSubject()).toBe('user@example.com')
    expect(getFrontendAuthStorageScope()).toBe('user%40example.com')
    await expect(getFrontendAccessToken()).resolves.toBe('access-token')
  })

  it('restores the default provider when registration is disposed', () => {
    const dispose = setFrontendAuthSessionProvider({
      getSubject: () => 'user-1',
      getAccessToken: () => 'token',
    })

    dispose()
    expect(getFrontendAuthSubject()).toBe('local-development-user')
  })
})
