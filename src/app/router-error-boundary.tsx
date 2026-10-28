import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'

export function RouterErrorBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const message = error instanceof Error ? error.message : 'Unexpected error'

  return (
    <main className="home-shell" id="main-content">
      <section className="hero" aria-labelledby="router-error-title">
        <p className="eyebrow">Forma Workspace</p>
        <h1 id="router-error-title">Something went wrong.</h1>
        <p className="hero-copy">
          We could not finish loading this view. You can retry the current
          route or return to the workspace home.
        </p>
        <p role="alert">{message}</p>
        <div>
          <button type="button" onClick={() => void router.invalidate()}>
            Retry
          </button>
          <Link to="/">Go home</Link>
        </div>
      </section>
    </main>
  )
}
