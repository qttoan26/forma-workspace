import {
  useEffect,
  useRef,
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
  SettingsIcon,
  ShieldIcon,
  SparkIcon,
  UsersIcon,
  XIcon,
} from '@/shared/ui/workspace-icons'
import { workspaceModules } from '@/shared/workspace/module-registry'
import { workSectionPath } from '@/shared/workspace/work-section-registry'
import {
  getModuleSections,
  moduleSectionPath,
} from '@/shared/workspace/module-section-registry'

import { WorkspaceNavigationSearch } from '@/widgets/workspace-navigation-search/workspace-navigation-search'

import './workspace-shell.css'
import './workspace-mobile.css'

const appBaseUrl = import.meta.env.BASE_URL
const mobileNavigationQuery =
  '(max-width: 760px), (max-width: 1024px) and (pointer: coarse)'
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
  const [openModuleId, setOpenModuleId] = useState<string | null>(
    activeModuleId ?? null,
  )
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia?.(mobileNavigationQuery).matches ?? false,
  )
  const sidebarRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const demoMode = isDemoMode()

  useEffect(() => {
    const media = window.matchMedia?.(mobileNavigationQuery)
    if (!media) return
    const update = () => {
      setIsMobile(media.matches)
      setMobileOpen(false)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!mobileOpen || !isMobile) return
    const menuButton = menuButtonRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sidebarRef.current
      ?.querySelector<HTMLButtonElement>('.workspace-sidebar-close')
      ?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ) ?? [],
      ).filter(
        (element) =>
          !element.closest('[inert]') && element.getClientRects().length > 0,
      )
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      menuButton?.focus()
    }
  }, [mobileOpen, isMobile])
  const adminModule = workspaceModules.find((module) => module.id === 'admin')
  const primaryModules = workspaceModules.filter(
    (module) => module.id !== 'admin',
  )

  function renderModule(module: (typeof workspaceModules)[number]) {
    const ModuleIcon = moduleIcons[module.id] ?? ClipboardIcon
    const active = activeModuleId === module.id
    const expanded = openModuleId === module.id
    const sections = getModuleSections(module.id)
    function openGroup() {
      if (!sidebarExpanded && !isMobile) {
        setSidebarExpanded(true)
        saveSidebarPreference(true)
        setOpenModuleId(module.id)
      } else {
        setOpenModuleId(expanded ? null : module.id)
      }
    }
    const showSections = (sidebarExpanded || isMobile) && expanded
    return (
      <div
        className={`workspace-sidebar-group${active ? ' is-active' : ''}`}
        key={module.id}
      >
        <button
          className="workspace-sidebar-link workspace-sidebar-group-toggle"
          type="button"
          aria-label={
            !sidebarExpanded && !isMobile
              ? `Open ${module.label} menu`
              : `${expanded ? 'Collapse' : 'Expand'} ${module.label} sections`
          }
          aria-controls={`navigation-${module.id}`}
          aria-expanded={showSections}
          aria-current={active ? 'location' : undefined}
          title={!sidebarExpanded && !isMobile ? module.label : undefined}
          onClick={openGroup}
        >
          <span className="workspace-sidebar-icon">
            <ModuleIcon />
          </span>
          <span className="workspace-sidebar-label">{module.label}</span>
          <ChevronDownIcon className="workspace-sidebar-chevron" />
        </button>
        <div
          className="workspace-sidebar-disclosure"
          data-open={showSections}
          aria-hidden={!showSections}
          inert={!showSections}
        >
          <div className="workspace-sidebar-disclosure-inner">
            <nav
              className="workspace-sidebar-children"
              id={`navigation-${module.id}`}
              aria-label={`${module.label} sections`}
            >
              {module.id !== 'work' ? (
                <a
                  href={hrefFor(module.path)}
                  aria-current={active && !activeSectionId ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  Overview
                </a>
              ) : null}
              {sections.map((section) => (
                <a
                  href={hrefFor(moduleSectionPath(module.id, section.id))}
                  key={section.id}
                  aria-current={
                    active && activeSectionId === section.id
                      ? 'page'
                      : undefined
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{section.label}</span>
                  {section.status === 'implementation' ? (
                    <span
                      className="workspace-sidebar-pending"
                      title="Implementation in progress"
                      aria-label="Implementation in progress"
                    />
                  ) : null}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    )
  }

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
        tabIndex={-1}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`workspace-sidebar${mobileOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
        id="workspace-navigation"
        ref={sidebarRef}
        inert={isMobile && !mobileOpen}
      >
        <div className="workspace-sidebar-inner">
          <div className="workspace-sidebar-brand-row">
            <button
              className="workspace-sidebar-collapse"
              type="button"
              aria-label={
                sidebarExpanded ? 'Collapse navigation' : 'Expand navigation'
              }
              aria-expanded={sidebarExpanded}
              aria-controls="workspace-navigation"
              title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
              onClick={toggleSidebar}
            >
              <MenuIcon />
            </button>
            <a
              className="workspace-sidebar-brand"
              inert={!sidebarExpanded && !isMobile}
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

            <p className="workspace-sidebar-section-label">Modules</p>
            {primaryModules.map(renderModule)}
          </nav>

          {adminModule ? (
            <div className="workspace-sidebar-footer">
              {renderModule(adminModule)}
            </div>
          ) : null}
        </div>
      </aside>

      <div className="workspace-shell-main" inert={isMobile && mobileOpen}>
        <header className="workspace-topbar">
          <div className="workspace-topbar-context">
            <button
              className="workspace-menu-button"
              type="button"
              aria-label="Open navigation"
              ref={menuButtonRef}
              aria-controls="workspace-navigation"
              aria-expanded={mobileOpen}
              onClick={(event) => {
                menuButtonRef.current = event.currentTarget
                setMobileOpen(true)
              }}
            >
              <MenuIcon />
            </button>
            <div>
              <small>Forma Workspace</small>
              <strong title={pageLabel}>{pageLabel}</strong>
            </div>
          </div>

          <div className="workspace-topbar-actions">
            <WorkspaceNavigationSearch disabled={mobileOpen} />
            <a
              className="workspace-notification-button"
              aria-label="Open inbox"
              href={hrefFor(workSectionPath('inbox'))}
              title="Inbox"
            >
              <BellIcon />
            </a>
            <span
              className="workspace-account"
              aria-label={
                demoMode ? 'Demo account: Sam Lee' : 'Workspace account'
              }
            >
              <span className="workspace-account-copy">
                <strong>{demoMode ? 'Sam Lee' : 'Account'}</strong>
                <small>
                  {demoMode ? 'Demo workspace' : 'Workspace member'}
                </small>
              </span>
              <span className="workspace-avatar" aria-hidden="true">
                {demoMode ? 'SL' : 'F'}
              </span>
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
        </header>

        <main
          className="workspace-shell-content"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
        <nav className="workspace-mobile-dock" aria-label="Mobile navigation">
          <a
            href={appBaseUrl}
            aria-current={!activeModuleId ? 'page' : undefined}
          >
            <HomeIcon />
            <span>Home</span>
          </a>
          <a
            href={hrefFor(workSectionPath('overview'))}
            aria-current={
              activeModuleId === 'work' && activeSectionId !== 'inbox'
                ? 'page'
                : undefined
            }
          >
            <ClipboardIcon />
            <span>Work</span>
          </a>
          <a
            href={hrefFor(workSectionPath('inbox'))}
            aria-current={
              activeModuleId === 'work' && activeSectionId === 'inbox'
                ? 'page'
                : undefined
            }
          >
            <BellIcon />
            <span>Inbox</span>
          </a>
          <button
            type="button"
            aria-label="Browse modules"
            aria-controls="workspace-navigation"
            aria-expanded={mobileOpen}
            onClick={(event) => {
              menuButtonRef.current = event.currentTarget
              setMobileOpen(true)
            }}
          >
            <MenuIcon />
            <span>Menu</span>
          </button>
        </nav>
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
