import { useState } from 'react'

import { getAuthLoginUrl, startLogin } from '@/shared/auth/auth-session'

export function LoginPage() {
  const [missingConfiguration, setMissingConfiguration] = useState(false)
  const loginUrl = getAuthLoginUrl()

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
        onClick={() => {
          if (!startLogin()) setMissingConfiguration(true)
        }}
        disabled={!loginUrl && missingConfiguration}
      >
        Sign in
      </button>
      {missingConfiguration ? (
        <p role="alert">
          Sign-in is not configured for this environment. Set
          {' '}VITE_AUTH_LOGIN_URL before enabling protected production access.
        </p>
      ) : null}
    </main>
  )
}
