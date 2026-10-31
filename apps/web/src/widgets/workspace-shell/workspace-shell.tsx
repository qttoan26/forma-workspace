import {
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react'

import { isDemoMode, startLogout } from '@/shared/auth/auth-session'
import {
  BellIcon,
  BuildingIcon,
  ChevronDownIcon,
  ClipboardIcon,
  FactoryIcon,
  FileStackIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SparkIcon,
  UsersIcon,
  XIcon,
} from '@/shared/ui/workspace-icons'
import { workspaceModules } from '@/shared/workspace/module-registry'

import './workspace-shell.css'

const appBaseUrl = import.meta.env.BASE_URL

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

type WorkspaceIcon = ComponentType<SVGProps<SVGSVGElement>>

const moduleIcons: Record<string, WorkspaceIcon> = {
  work: ClipboardIcon,
  production: FactoryIcon,
  documents: FileStackIcon,
  automation: SparkIcon,
  vendors: UsersIcon,
  customers: BuildingIcon,
  governance: ShieldIcon,
  admin: SettingsIcon,
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
            <XIcon />
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
            <span className="workspace-sidebar-icon" aria-hidden="true">
              <HomeIcon />
            </span>
            <span>Overview</span>
          </a>

          <p className="workspace-sidebar-section-label">Operations</p>
          {workspaceModules.map((module) => {
            const ModuleIcon = moduleIcons[module.id] ?? ClipboardIcon

            return (
              <a
                className="workspace-sidebar-link"
                aria-current={activeModuleId === module.id ? 'page' : undefined}
                href={hrefFor(module.path)}
                key={module.id}
                onClick={() => setMobileOpen(false)}
              >
                <span className="workspace-sidebar-icon" aria-hidden="true">
                  <ModuleIcon />
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
            )
          })}
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
              <MenuIcon />
            </button>
            <div>
              <small>Forma Workspace</small>
              <strong>{pageLabel}</strong>
            </div>
          </div>

          <div className="workspace-topbar-actions">
            <button className="workspace-search-button" type="button">
              <SearchIcon />
              <span>Search</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="workspace-notification-button"
              type="button"
              aria-label="Notifications, 2 unread"
            >
              <BellIcon />
              <span className="workspace-notification-count">2</span>
            </button>
            <button
              className="workspace-account"
              type="button"
              aria-label="Open account menu"
            >
              <span className="workspace-account-copy">
                <strong>Sam Lee</strong>
                <small>Frontend</small>
              </span>
              <span className="workspace-avatar" aria-hidden="true">
                SL
              </span>
              <ChevronDownIcon className="workspace-account-chevron" />
            </button>
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
        </header>

        <main className="workspace-shell-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
