import { workspaceModules } from '@/shared/workspace/module-registry'

import './workspace-navbar.css'

const appBaseUrl = import.meta.env.BASE_URL

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

export function WorkspaceNavbar({
  activeModuleId,
}: {
  activeModuleId?: string
}) {
  return (
    <nav className="workspace-navbar" aria-label="Workspace modules">
      <div className="workspace-navbar-context">
        <span className="workspace-navbar-context-label">Workspace</span>
        <a
          aria-current={!activeModuleId ? 'page' : undefined}
          className="workspace-navbar-home"
          href={appBaseUrl}
        >
          Overview
        </a>
      </div>

      <span className="workspace-navbar-divider" aria-hidden="true" />

      <div className="workspace-navbar-scroll">
        <div className="workspace-navbar-modules">
          {workspaceModules.map((module) => (
            <a
              aria-current={activeModuleId === module.id ? 'page' : undefined}
              className="workspace-navbar-link"
              data-status={module.status}
              href={hrefFor(module.path)}
              key={module.id}
            >
              <span>{module.label}</span>
              {module.status === 'implementation' ? (
                <span
                  className="workspace-navbar-state"
                  aria-label="Implementation in progress"
                  title="Implementation in progress"
                />
              ) : null}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
