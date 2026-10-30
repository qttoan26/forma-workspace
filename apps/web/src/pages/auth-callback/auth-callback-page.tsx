import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { completeOidcLogin } from '@/shared/auth/oidc-client'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void completeOidcLogin()
      .then(async () => {
        if (!active) return
        await navigate({ to: '/' })
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
  }, [navigate])

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
