import { useState, type ReactNode } from 'react'

import { isDemoMode, startLogout } from '@/shared/auth/auth-session'
import { workspaceModules } from '@/shared/workspace/module-registry'

import './workspace-shell.css'

const appBaseUrl = import.meta.env.BASE_URL

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

const moduleGlyphs: Record<string, string> = {
  work: 'W',
  production: 'P',
  documents: 'D',
  automation: 'A',
  vendors: 'V',
  customers: 'C',
  governance: 'G',
  admin: 'S',
}

type WorkspaceShellProps = {
  activeModuleId?: string
  pageLabel: string
  children: ReactNode
}

export function WorkspaceShell({
  activeModuleId,
  pageLabel,
  children,
}: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const demoMode = isDemoMode()

  return (
    <div className="workspace-shell">
      <button
        className={`workspace-shell-backdrop${mobileOpen ? ' is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`workspace-sidebar${mobileOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="workspace-sidebar-brand-row">
          <a
            className="workspace-sidebar-brand"
            href={appBaseUrl}
            aria-label="Forma Workspace home"
          >
            <span className="workspace-sidebar-brand-mark" aria-hidden="true">
              F
            </span>
            <span>
              <strong>Forma</strong>
              <small>Workspace</small>
            </span>
          </a>
          <button
            className="workspace-sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="workspace-sidebar-nav" aria-label="Workspace modules">
          <p className="workspace-sidebar-section-label">Workspace</p>
          <a
            className="workspace-sidebar-link"
            aria-current={!activeModuleId ? 'page' : undefined}
            href={appBaseUrl}
            onClick={() => setMobileOpen(false)}
          >
            <span className="workspace-sidebar-glyph" aria-hidden="true">
              O
            </span>
            <span>Overview</span>
          </a>

          <p className="workspace-sidebar-section-label">Operations</p>
          {workspaceModules.map((module) => (
            <a
              className="workspace-sidebar-link"
              aria-current={activeModuleId === module.id ? 'page' : undefined}
              href={hrefFor(module.path)}
              key={module.id}
              onClick={() => setMobileOpen(false)}
            >
              <span className="workspace-sidebar-glyph" aria-hidden="true">
                {moduleGlyphs[module.id] ?? module.label.charAt(0)}
              </span>
              <span className="workspace-sidebar-link-copy">
                <span>{module.label}</span>
                {module.status === 'implementation' ? (
                  <small>In progress</small>
                ) : null}
              </span>
              {module.id === 'work' ? (
                <span
                  className="workspace-sidebar-counter"
                  aria-label="3 open tasks"
                >
                  3
                </span>
              ) : null}
            </a>
          ))}
        </nav>

        <div className="workspace-sidebar-footer">
          <span className="workspace-sidebar-footer-dot" aria-hidden="true" />
          <span>
            <strong>System online</strong>
            <small>Demo workspace</small>
          </span>
        </div>
      </aside>

      <div className="workspace-shell-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-context">
            <button
              className="workspace-menu-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div>
              <small>Forma Workspace</small>
              <strong>{pageLabel}</strong>
            </div>
          </div>

          <div className="workspace-topbar-actions">
            <button className="workspace-search-button" type="button">
              <span aria-hidden="true">⌕</span>
              <span>Search workspace</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="workspace-notification-button"
              type="button"
              aria-label="Notifications, 2 unread"
            >
              <span aria-hidden="true">◌</span>
              <span className="workspace-notification-count">2</span>
            </button>
            <div className="workspace-account" aria-label="Signed in user">
              <span className="workspace-account-copy">
                <strong>Sam Lee</strong>
                <small>Frontend</small>
              </span>
              <span className="workspace-avatar" aria-hidden="true">
                SL
              </span>
              {demoMode ? (
                <span className="workspace-demo-badge">Demo</span>
              ) : (
                <button
                  className="workspace-sign-out"
                  type="button"
                  onClick={startLogout}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="workspace-shell-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
