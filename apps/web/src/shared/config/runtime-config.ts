type WebRuntimeEnvironment = {
  VITE_DEPLOYMENT_MODE?: string
  VITE_DEMO_MODE?: string
  VITE_API_BASE_URL?: string
  VITE_OIDC_AUTHORIZATION_ENDPOINT?: string
  VITE_OIDC_TOKEN_ENDPOINT?: string
  VITE_OIDC_CLIENT_ID?: string
  VITE_OIDC_REDIRECT_URI?: string
}

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new Error(`${name} is required for production authentication`)
  }
  return normalized
}

function validateHttpsUrl(value: string, name: string): void {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid URL`)
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTPS in production`)
  }
}

export function validateWebRuntimeConfiguration(
  environment: WebRuntimeEnvironment = import.meta.env,
): void {
  const deploymentMode = environment.VITE_DEPLOYMENT_MODE?.trim()
  if (deploymentMode !== 'production') {
    return
  }
  if (environment.VITE_DEMO_MODE === 'true') {
    return
  }

  const apiValue = environment.VITE_API_BASE_URL
  const authorizationValue = environment.VITE_OIDC_AUTHORIZATION_ENDPOINT
  const tokenValue = environment.VITE_OIDC_TOKEN_ENDPOINT
  const clientIdValue = environment.VITE_OIDC_CLIENT_ID
  const redirectValue = environment.VITE_OIDC_REDIRECT_URI

  const apiBaseUrl = required(apiValue, 'VITE_API_BASE_URL')
  const authorizationEndpoint = required(
    authorizationValue,
    'VITE_OIDC_AUTHORIZATION_ENDPOINT',
  )
  const tokenEndpoint = required(tokenValue, 'VITE_OIDC_TOKEN_ENDPOINT')
  required(clientIdValue, 'VITE_OIDC_CLIENT_ID')
  const redirectUri = required(redirectValue, 'VITE_OIDC_REDIRECT_URI')

  validateHttpsUrl(apiBaseUrl, 'VITE_API_BASE_URL')
  validateHttpsUrl(
    authorizationEndpoint,
    'VITE_OIDC_AUTHORIZATION_ENDPOINT',
  )
  validateHttpsUrl(tokenEndpoint, 'VITE_OIDC_TOKEN_ENDPOINT')
  validateHttpsUrl(redirectUri, 'VITE_OIDC_REDIRECT_URI')
}
