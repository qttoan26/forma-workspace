export interface FrontendAuthSessionProvider {
  getSubject: () => string | null
  getAccessToken: () => Promise<string | null> | string | null
}

const localDevelopmentSubject = 'local-development-user'
const anonymousSubject = 'anonymous'

let authSessionProvider: FrontendAuthSessionProvider | null = null

export function setFrontendAuthSessionProvider(
  provider: FrontendAuthSessionProvider,
): () => void {
  authSessionProvider = provider

  return () => {
    if (authSessionProvider === provider) authSessionProvider = null
  }
}

export function getFrontendAuthSubject(): string {
  if (!authSessionProvider) return localDevelopmentSubject

  const subject = authSessionProvider.getSubject()?.trim()
  return subject || anonymousSubject
}

export function getFrontendAuthStorageScope(): string {
  return encodeURIComponent(getFrontendAuthSubject())
}

export async function getFrontendAccessToken(): Promise<string | null> {
  if (!authSessionProvider) return null

  const token = await authSessionProvider.getAccessToken()
  const normalized = token?.trim()
  return normalized || null
}

export function resetFrontendAuthSessionProvider() {
  authSessionProvider = null
}
