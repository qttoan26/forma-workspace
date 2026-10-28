import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'

interface RouterErrorViewProps {
  error: unknown
  onRetry: () => void
}

export function RouterErrorView({ error, onRetry }: RouterErrorViewProps) {
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
          <button type="button" onClick={onRetry}>
            Retry
          </button>
          <a href="/">Go home</a>
        </div>
      </section>
    </main>
  )
}

export function RouterErrorBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <RouterErrorView
      error={error}
      onRetry={() => void router.invalidate()}
    />
  )
}
