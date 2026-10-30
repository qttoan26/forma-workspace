const localDevelopmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function getCorsOrigins(value = process.env.CORS_ORIGINS): string[] {
  if (!value) return localDevelopmentOrigins

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return [...new Set(origins)]
}
