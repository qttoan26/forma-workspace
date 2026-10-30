const DEFAULT_API_PORT = 3001
const MAX_API_PORT = 65_535
const MINIMUM_JWT_SECRET_LENGTH = 32

type RuntimeEnvironment = {
  NODE_ENV?: string
  PORT?: string
  MONGODB_URI?: string
  CORS_ORIGINS?: string
  AUTH_ISSUER?: string
  AUTH_AUDIENCE?: string
  AUTH_JWKS_URL?: string
  AUTH_JWT_SECRET?: string
}

export function getApiPort(value = process.env.PORT) {
  if (value === undefined || value.trim() === '') return DEFAULT_API_PORT

  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > MAX_API_PORT) {
    throw new Error(`PORT must be an integer between 1 and ${MAX_API_PORT}`)
  }

  return port
}

export function validateRuntimeConfiguration(
  environment: RuntimeEnvironment = process.env,
) {
  if (environment.PORT !== undefined) getApiPort(environment.PORT)

  validateAuthConfiguration(environment)

  if (environment.NODE_ENV !== 'production') return

  if (!environment.MONGODB_URI?.trim()) {
    throw new Error('MONGODB_URI is required when NODE_ENV=production')
  }

  if (!environment.CORS_ORIGINS?.trim()) {
    throw new Error('CORS_ORIGINS is required when NODE_ENV=production')
  }
}

function validateAuthConfiguration(environment: RuntimeEnvironment) {
  const issuer = environment.AUTH_ISSUER?.trim()
  const audience = environment.AUTH_AUDIENCE?.trim()
  const jwksUrl = environment.AUTH_JWKS_URL?.trim()
  const jwtSecret = environment.AUTH_JWT_SECRET?.trim()
  const hasAnyAuthConfiguration = Boolean(
    issuer || audience || jwksUrl || jwtSecret,
  )

  if (environment.NODE_ENV !== 'production' && !hasAnyAuthConfiguration) return

  if (!issuer) {
    throw new Error('AUTH_ISSUER is required when authentication is enabled')
  }

  if (!audience) {
    throw new Error('AUTH_AUDIENCE is required when authentication is enabled')
  }

  if (Boolean(jwksUrl) === Boolean(jwtSecret)) {
    throw new Error('Configure exactly one of AUTH_JWKS_URL or AUTH_JWT_SECRET')
  }

  if (jwtSecret && jwtSecret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(
      `AUTH_JWT_SECRET must be at least ${MINIMUM_JWT_SECRET_LENGTH} characters`,
    )
  }

  if (jwksUrl) {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(jwksUrl)
    } catch {
      throw new Error('AUTH_JWKS_URL must be a valid URL')
    }

    if (
      environment.NODE_ENV === 'production' &&
      parsedUrl.protocol !== 'https:'
    ) {
      throw new Error('AUTH_JWKS_URL must use HTTPS in production')
    }
  }
}
