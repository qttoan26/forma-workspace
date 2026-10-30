const DEFAULT_API_PORT = 3001
const MAX_API_PORT = 65_535

type RuntimeEnvironment = {
  NODE_ENV?: string
  PORT?: string
  MONGODB_URI?: string
  CORS_ORIGINS?: string
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
  if (environment.NODE_ENV !== 'production') return

  if (!environment.MONGODB_URI?.trim()) {
    throw new Error('MONGODB_URI is required when NODE_ENV=production')
  }

  if (!environment.CORS_ORIGINS?.trim()) {
    throw new Error('CORS_ORIGINS is required when NODE_ENV=production')
  }
}
