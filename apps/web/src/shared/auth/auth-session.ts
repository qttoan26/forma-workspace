import { redirect } from '@tanstack/react-router'

import { getApiAuthorizationHeader } from '@/shared/api/api-auth'

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

export async function loadAuthSession(
  baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? '',
): Promise<AuthSession | null> {
  const authorizationHeader = await getApiAuthorizationHeader()
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    ...(authorizationHeader ? { headers: authorizationHeader } : {}),
  })

  if (response.status === 401) return null
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

export function startLogout() {
  const logoutUrl = getAuthLogoutUrl()
  if (!logoutUrl) return false

  window.location.assign(logoutUrl)
  return true
}
