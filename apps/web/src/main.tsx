import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import '@/app/styles/tokens.css'
import '@/app/styles/global.css'
import { initializeAuthSessionLifecycle } from '@/shared/auth/auth-session'
import { initializeOidcAccessTokenProvider } from '@/shared/auth/oidc-client'

initializeOidcAccessTokenProvider()
initializeAuthSessionLifecycle()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Application root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
