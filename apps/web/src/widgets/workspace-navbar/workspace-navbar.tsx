import { workspaceModules } from '@/shared/workspace/module-registry'

import './workspace-navbar.css'

const appBaseUrl = import.meta.env.BASE_URL

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

export function WorkspaceNavbar({ activeModuleId }: { activeModuleId?: string }) {
  return (
    <nav className="workspace-navbar" aria-label="Workspace modules">
      <a className="workspace-navbar-home" href={appBaseUrl}>
        Overview
      </a>
      <div className="workspace-navbar-modules">
        {workspaceModules.map((module) => (
          <a
            aria-current={activeModuleId === module.id ? 'page' : undefined}
            className="workspace-navbar-link"
            href={hrefFor(module.path)}
            key={module.id}
          >
            {module.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
