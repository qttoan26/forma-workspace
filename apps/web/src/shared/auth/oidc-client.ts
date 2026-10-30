import { configureApiAccessTokenProvider } from '@/shared/api/api-auth'

const transactionKey = 'forma.oidc.transaction'
const sessionKey = 'forma.oidc.session'

interface OidcConfig {
  authorizationEndpoint: string
  tokenEndpoint: string
  clientId: string
  redirectUri: string
  scope: string
}

interface OidcTransaction {
  state: string
  codeVerifier: string
}

interface OidcTokenResponse {
  access_token?: unknown
  expires_in?: unknown
}

interface StoredOidcSession {
  accessToken: string
  expiresAt: number
}

function readRequiredEnv(value: string | undefined, name: string): string {
  const normalizedValue = value?.trim()
  if (!normalizedValue) {
    throw new Error(`${name} is required for OIDC authentication`)
  }
  return normalizedValue
}

export function getOidcConfig(): OidcConfig {
  return {
    authorizationEndpoint: readRequiredEnv(
      import.meta.env.VITE_OIDC_AUTHORIZATION_ENDPOINT,
      'VITE_OIDC_AUTHORIZATION_ENDPOINT',
    ),
    tokenEndpoint: readRequiredEnv(
      import.meta.env.VITE_OIDC_TOKEN_ENDPOINT,
      'VITE_OIDC_TOKEN_ENDPOINT',
    ),
    clientId: readRequiredEnv(
      import.meta.env.VITE_OIDC_CLIENT_ID,
      'VITE_OIDC_CLIENT_ID',
    ),
    redirectUri: readRequiredEnv(
      import.meta.env.VITE_OIDC_REDIRECT_URI,
      'VITE_OIDC_REDIRECT_URI',
    ),
    scope: import.meta.env.VITE_OIDC_SCOPE?.trim() || 'openid profile email',
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function randomUrlSafeString(byteLength = 32): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)))
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  )
  return base64UrlEncode(new Uint8Array(digest))
}

export async function beginOidcLogin(): Promise<void> {
  const config = getOidcConfig()
  const state = randomUrlSafeString()
  const codeVerifier = randomUrlSafeString(48)
  const codeChallenge = await createCodeChallenge(codeVerifier)

  sessionStorage.setItem(
    transactionKey,
    JSON.stringify({ state, codeVerifier } satisfies OidcTransaction),
  )

  const authorizationUrl = new URL(config.authorizationEndpoint)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('client_id', config.clientId)
  authorizationUrl.searchParams.set('redirect_uri', config.redirectUri)
  authorizationUrl.searchParams.set('scope', config.scope)
  authorizationUrl.searchParams.set('state', state)
  authorizationUrl.searchParams.set('code_challenge', codeChallenge)
  authorizationUrl.searchParams.set('code_challenge_method', 'S256')

  window.location.assign(authorizationUrl.toString())
}

function readTransaction(): OidcTransaction {
  const raw = sessionStorage.getItem(transactionKey)
  if (!raw) throw new Error('OIDC login transaction is missing')

  const parsed = JSON.parse(raw) as Partial<OidcTransaction>
  if (!parsed.state || !parsed.codeVerifier) {
    throw new Error('OIDC login transaction is invalid')
  }
  return { state: parsed.state, codeVerifier: parsed.codeVerifier }
}

export async function completeOidcLogin(callbackUrl = window.location.href) {
  const config = getOidcConfig()
  const url = new URL(callbackUrl)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    throw new Error(`OIDC authorization failed: ${error}`)
  }
  if (!code || !state) {
    throw new Error('OIDC callback is missing code or state')
  }

  const transaction = readTransaction()
  if (transaction.state !== state) {
    throw new Error('OIDC state validation failed')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: transaction.codeVerifier,
  })

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`OIDC token exchange failed (${response.status})`)
  }

  const token = (await response.json()) as OidcTokenResponse
  if (typeof token.access_token !== 'string' || !token.access_token.trim()) {
    throw new Error('OIDC token response did not include an access token')
  }

  const expiresIn =
    typeof token.expires_in === 'number' && Number.isFinite(token.expires_in)
      ? token.expires_in
      : 3600

  const session: StoredOidcSession = {
    accessToken: token.access_token.trim(),
    expiresAt: Date.now() + Math.max(0, expiresIn - 30) * 1000,
  }
  sessionStorage.setItem(sessionKey, JSON.stringify(session))
  sessionStorage.removeItem(transactionKey)

  return session
}

function readStoredSession(): StoredOidcSession | null {
  const raw = sessionStorage.getItem(sessionKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredOidcSession>
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      sessionStorage.removeItem(sessionKey)
      return null
    }
    return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt }
  } catch {
    sessionStorage.removeItem(sessionKey)
    return null
  }
}

export function initializeOidcAccessTokenProvider(): () => void {
  return configureApiAccessTokenProvider(() => readStoredSession()?.accessToken)
}

export function clearOidcSession(): void {
  sessionStorage.removeItem(sessionKey)
  sessionStorage.removeItem(transactionKey)
}
