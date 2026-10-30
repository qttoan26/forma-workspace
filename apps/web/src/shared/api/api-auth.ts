export type ApiAccessTokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>

const anonymousAccessTokenProvider: ApiAccessTokenProvider = () => null

let accessTokenProvider: ApiAccessTokenProvider = anonymousAccessTokenProvider

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

export async function getApiAuthorizationHeader(): Promise<
  Record<'Authorization', string> | undefined
> {
  const token = (await accessTokenProvider())?.trim()
  if (!token) return undefined

  return { Authorization: `Bearer ${token}` }
}
