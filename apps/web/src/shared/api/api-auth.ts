export type ApiAccessTokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>

export type ApiUnauthorizedHandler = () => void

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
}

const anonymousAccessTokenProvider: ApiAccessTokenProvider = () => null
const noopUnauthorizedHandler: ApiUnauthorizedHandler = () => undefined

let accessTokenProvider: ApiAccessTokenProvider = anonymousAccessTokenProvider
let unauthorizedHandler: ApiUnauthorizedHandler = noopUnauthorizedHandler

export function configureApiAccessTokenProvider(
  provider: ApiAccessTokenProvider,
): () => void {
  accessTokenProvider = provider

  return () => {
    if (accessTokenProvider === provider) {
      accessTokenProvider = anonymousAccessTokenProvider
    }
  }
}

export function configureApiUnauthorizedHandler(
  handler: ApiUnauthorizedHandler,
): () => void {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = noopUnauthorizedHandler
    }
  }
}

export async function getApiAuthorizationHeader(): Promise<
  Record<'Authorization', string> | undefined
> {
  const token = (await accessTokenProvider())?.trim()
  if (!token) return undefined

  return { Authorization: `Bearer ${token}` }
}

export function handleApiUnauthorizedResponse(response: Response): boolean {
  if (response.status !== 401) return false

  unauthorizedHandler()
  return true
}
