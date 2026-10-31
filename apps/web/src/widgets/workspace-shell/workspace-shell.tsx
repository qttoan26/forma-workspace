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
  CheckSquareIcon,
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
import { workSectionPath } from '@/shared/workspace/work-section-registry'

import './workspace-shell.css'
import './workspace-sidebar-bitrix.css'

const appBaseUrl = import.meta.env.BASE_URL
const sidebarPreferenceKey = 'forma-workspace:sidebar-expanded:v1'

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

const personalLinks = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: BellIcon,
    path: workSectionPath('inbox'),
    counter: 3,
  },
  {
    id: 'my-tasks',
    label: 'My Tasks',
    icon: CheckSquareIcon,
    path: workSectionPath('my-tasks'),
    counter: 2,
  },
] as const

type WorkspaceShellProps = {
  activeModuleId?: string | undefined
  activeSectionId?: string | undefined
  pageLabel: string
  children: ReactNode
}

export function WorkspaceShell({
  activeModuleId,
  activeSectionId,
  pageLabel,
  children,
}: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(readSidebarPreference)
  const demoMode = isDemoMode()
  const adminModule = workspaceModules.find((module) => module.id === 'admin')
  const primaryModules = workspaceModules.filter((module) => module.id !== 'admin')

  function toggleSidebar() {
    setSidebarExpanded((expanded) => {
      const next = !expanded
      saveSidebarPreference(next)
      return next
    })
  }

  return (
    <div
      className={`workspace-shell${sidebarExpanded ? ' is-sidebar-expanded' : ' is-sidebar-collapsed'}`}
    >
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
            title={sidebarExpanded ? undefined : 'Forma Workspace'}
          >
            <span className="workspace-sidebar-brand-mark" aria-hidden="true">
              F
            </span>
            <span className="workspace-sidebar-brand-copy">
              <strong>Forma</strong>
              <small>Workspace</small>
            </span>
          </a>
          <button
            className="workspace-sidebar-collapse"
            type="button"
            aria-label={sidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={sidebarExpanded}
            title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </button>
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
            title={sidebarExpanded ? undefined : 'Overview'}
            onClick={() => setMobileOpen(false)}
          >
            <span className="workspace-sidebar-icon" aria-hidden="true">
              <HomeIcon />
            </span>
            <span className="workspace-sidebar-label">Overview</span>
          </a>

          {personalLinks.map((item) => {
            const PersonalIcon = item.icon
            const active =
              activeModuleId === 'work' && activeSectionId === item.id

            return (
              <a
                className="workspace-sidebar-link"
                aria-current={active ? 'page' : undefined}
                href={hrefFor(item.path)}
                key={item.id}
                title={sidebarExpanded ? undefined : item.label}
                onClick={() => setMobileOpen(false)}
              >
                <span className="workspace-sidebar-icon" aria-hidden="true">
                  <PersonalIcon />
                </span>
                <span className="workspace-sidebar-label">{item.label}</span>
                <span className="workspace-sidebar-counter">
                  {item.counter}
                </span>
              </a>
            )
          })}

          <p className="workspace-sidebar-section-label">Operations</p>
          {primaryModules.map((module) => {
            const ModuleIcon = moduleIcons[module.id] ?? ClipboardIcon
            const active = activeModuleId === module.id && !activeSectionId

            return (
              <a
                className="workspace-sidebar-link"
                aria-current={active ? 'page' : undefined}
                href={hrefFor(module.path)}
                key={module.id}
                title={sidebarExpanded ? undefined : module.label}
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
                    aria-label="4 open tasks"
                  >
                    4
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>

        {adminModule ? (
          <div className="workspace-sidebar-footer">
            <a
              className="workspace-sidebar-link workspace-sidebar-settings"
              aria-current={activeModuleId === 'admin' ? 'page' : undefined}
              href={hrefFor(adminModule.path)}
              title={sidebarExpanded ? undefined : 'Settings'}
              onClick={() => setMobileOpen(false)}
            >
              <span className="workspace-sidebar-icon" aria-hidden="true">
                <SettingsIcon />
              </span>
              <span className="workspace-sidebar-label">Settings</span>
            </a>
          </div>
        ) : null}
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

function readSidebarPreference() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(sidebarPreferenceKey) === 'true'
  } catch {
    return false
  }
}

function saveSidebarPreference(expanded: boolean) {
  try {
    window.localStorage.setItem(sidebarPreferenceKey, String(expanded))
  } catch {
    // Sidebar preference is non-critical and may remain session-only.
  }
}
