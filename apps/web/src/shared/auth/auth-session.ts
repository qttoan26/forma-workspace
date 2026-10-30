import { redirect } from '@tanstack/react-router'

import {
  configureApiUnauthorizedHandler,
  getApiAuthorizationHeader,
  handleApiUnauthorizedResponse,
} from '@/shared/api/api-auth'
import { clearOidcSession } from '@/shared/auth/oidc-client'

const authReturnToKey = 'forma.auth.return-to'

export interface AuthenticatedUser {
  id: string
}

export interface AuthSession {
  user: AuthenticatedUser
}

export function getAuthLoginUrl(): string | undefined {
  return import.meta.env.VITE_AUTH_LOGIN_URL?.trim() || undefined
}

export function getAuthLogoutUrl(): string | undefined {
  return import.meta.env.VITE_AUTH_LOGOUT_URL?.trim() || undefined
}

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true'
}

export async function loadAuthSession(
  baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? '',
): Promise<AuthSession | null> {
  if (isDemoMode()) {
    return { user: { id: 'demo-user' } }
  }

  const authorizationHeader = await getApiAuthorizationHeader()
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    ...(authorizationHeader ? { headers: authorizationHeader } : {}),
  })

  if (handleApiUnauthorizedResponse(response)) return null
  if (!response.ok) {
    throw new Error(`Failed to load authenticated session (${response.status})`)
  }

  const body = (await response.json()) as { id?: unknown }
  if (typeof body.id !== 'string' || !body.id.trim()) {
    throw new Error('Authenticated session response is invalid')
  }

  return { user: { id: body.id.trim() } }
}

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await loadAuthSession()
  if (!session) {
    rememberAuthReturnTo()
    // TanStack Router intentionally redirects by throwing a Redirect object.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/login' })
  }
  return session
}

export function startLogin() {
  const loginUrl = getAuthLoginUrl()
  if (!loginUrl) return false

  window.location.assign(loginUrl)
  return true
}

export function rememberAuthReturnTo(
  location: Pick<Location, 'pathname' | 'search' | 'hash'> = window.location,
): void {
  const returnTo = `${location.pathname}${location.search}${location.hash}`
  sessionStorage.setItem(authReturnToKey, returnTo)
}

export function consumeAuthReturnTo(): string | undefined {
  const returnTo = sessionStorage.getItem(authReturnToKey)
  sessionStorage.removeItem(authReturnToKey)
  if (!returnTo) return undefined

  try {
    const target = new URL(returnTo, window.location.origin)
    const basePath = import.meta.env.BASE_URL || '/'
    if (target.origin !== window.location.origin) return undefined
    if (!target.pathname.startsWith(basePath)) return undefined
    if (returnTo.startsWith('//')) return undefined
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return undefined
  }
}

export function clearAuthSession(): void {
  clearOidcSession()
}

export function getLocalLoginUrl(): string {
  return `${import.meta.env.BASE_URL}login`
}

export function initializeAuthSessionLifecycle(): () => void {
  return configureApiUnauthorizedHandler(() => {
    rememberAuthReturnTo()
    clearAuthSession()
    window.location.assign(getLocalLoginUrl())
  })
}

export function startLogout(): void {
  clearAuthSession()
  sessionStorage.removeItem(authReturnToKey)
  const logoutTarget = getAuthLogoutUrl() ?? getLocalLoginUrl()
  window.location.assign(logoutTarget)
}
