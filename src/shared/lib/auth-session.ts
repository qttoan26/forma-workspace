export interface FrontendAuthSessionProvider {
  getSubject: () => string | null
  getAccessToken: () => Promise<string | null> | string | null
  subscribe?: (listener: () => void) => () => void
}

export class FrontendAuthSessionChangedError extends Error {
  constructor() {
    super('Authentication session changed during the operation')
    this.name = 'FrontendAuthSessionChangedError'
  }
}

const localDevelopmentSubject = 'local-development-user'
const anonymousSubject = 'anonymous'

let authSessionProvider: FrontendAuthSessionProvider | null = null
let unsubscribeFromProvider: (() => void) | null = null
const sessionListeners = new Set<() => void>()

export function setFrontendAuthSessionProvider(
  provider: FrontendAuthSessionProvider,
): () => void {
  unsubscribeFromProvider?.()
  authSessionProvider = provider
  unsubscribeFromProvider = provider.subscribe?.(notifyFrontendAuthSessionChange) ?? null
  notifyFrontendAuthSessionChange()

  return () => {
    if (authSessionProvider !== provider) return

    unsubscribeFromProvider?.()
    unsubscribeFromProvider = null
    authSessionProvider = null
    notifyFrontendAuthSessionChange()
  }
}

export function subscribeFrontendAuthSession(listener: () => void) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

export function getFrontendAuthSubject(): string {
  if (!authSessionProvider) return localDevelopmentSubject

  const subject = authSessionProvider.getSubject()?.trim()
  return subject || anonymousSubject
}

export function getFrontendAuthStorageScope(): string {
  return encodeURIComponent(getFrontendAuthSubject())
}

export function assertFrontendAuthStorageScope(expectedScope: string) {
  if (getFrontendAuthStorageScope() !== expectedScope) {
    throw new FrontendAuthSessionChangedError()
  }
}

export async function getFrontendAccessToken(): Promise<string | null> {
  if (!authSessionProvider) return null

  const token = await authSessionProvider.getAccessToken()
  const normalized = token?.trim()
  return normalized || null
}

export function resetFrontendAuthSessionProvider() {
  unsubscribeFromProvider?.()
  unsubscribeFromProvider = null
  authSessionProvider = null
  notifyFrontendAuthSessionChange()
}

function notifyFrontendAuthSessionChange() {
  for (const listener of sessionListeners) listener()
}
