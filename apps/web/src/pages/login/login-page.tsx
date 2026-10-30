import { useState } from 'react'

import { beginOidcLogin } from '@/shared/auth/oidc-client'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  return (
    <main id="main-content" style={{ maxWidth: 520, margin: '0 auto', padding: '5rem 1.5rem' }}>
      <p className="eyebrow">Forma Workspace</p>
      <h1>Sign in to continue</h1>
      <p>
        Your workspace is protected. Continue through your organization&apos;s
        identity provider to access projects and tasks.
      </p>
      <button
        type="button"
        disabled={isStarting}
        onClick={() => {
          setIsStarting(true)
          setError(null)
          void beginOidcLogin().catch((reason: unknown) => {
            setIsStarting(false)
            setError(
              reason instanceof Error
                ? reason.message
                : 'Unable to start sign-in.',
            )
          })
        }}
      >
        {isStarting ? 'Redirecting…' : 'Sign in'}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </main>
  )
}
