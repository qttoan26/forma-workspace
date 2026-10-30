import { useEffect, useState } from 'react'

import { consumeAuthReturnTo } from '@/shared/auth/auth-session'
import { completeOidcLogin } from '@/shared/auth/oidc-client'

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void completeOidcLogin()
      .then(() => {
        if (!active) return
        window.location.assign(
          consumeAuthReturnTo() ?? import.meta.env.BASE_URL,
        )
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(
          reason instanceof Error
            ? reason.message
            : 'Unable to complete sign-in.',
        )
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main
      id="main-content"
      style={{ maxWidth: 520, margin: '0 auto', padding: '5rem 1.5rem' }}
    >
      <p className="eyebrow">Forma Workspace</p>
      <h1>{error ? 'Sign-in failed' : 'Completing sign-in…'}</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>Verifying your secure session.</p>
      )}
    </main>
  )
}
