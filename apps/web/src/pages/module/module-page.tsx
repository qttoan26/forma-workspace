import { getWorkspaceModule } from '@/shared/workspace/module-registry'
import { WorkspaceShell } from '@/widgets/workspace-shell/workspace-shell'

import './module-page.css'

const appBaseUrl = import.meta.env.BASE_URL
const projectHref = `${appBaseUrl}workspaces/forma/projects/project-1`

export function ModulePage({ moduleId }: { moduleId: string }) {
  const module = getWorkspaceModule(moduleId)

  if (!module) {
    return (
      <WorkspaceShell pageLabel="Module not found">
        <section className="module-page-content">
          <section className="module-state-card">
            <p className="eyebrow">Forma Workspace</p>
            <h1>Module not found</h1>
            <p>The requested workspace module is not available.</p>
            <a className="module-primary-action" href={appBaseUrl}>
              Back to workspace overview
            </a>
          </section>
        </section>
      </WorkspaceShell>
    )
  }

  const isWorkModule = module.id === 'work'

  return (
    <WorkspaceShell activeModuleId={module.id} pageLabel={module.label}>
      <section className="module-page-content" aria-labelledby="module-title">
        <header className="module-page-header">
          <div>
            <p className="eyebrow">{module.eyebrow}</p>
            <h1 id="module-title">{module.label}</h1>
            <p>{module.description}</p>
          </div>
          <span className={`module-status module-status-${module.status}`}>
            {module.status === 'available'
              ? 'Foundation available'
              : 'Implementation in progress'}
          </span>
        </header>

        {isWorkModule ? (
          <section className="module-state-card">
            <p className="eyebrow">Current foundation</p>
            <h2>Project execution is already connected.</h2>
            <p>
              The existing project board remains the first working feature
              inside the Work module while the broader work-management
              experience is being completed.
            </p>
            <a className="module-primary-action" href={projectHref}>
              Open project board
            </a>
          </section>
        ) : (
          <section
            className="module-state-card"
            aria-label={`${module.label} implementation status`}
          >
            <p className="eyebrow">Implementation status</p>
            <h2>This module is being completed.</h2>
            <p>
              Navigation and module boundaries are in place first. Detailed
              workflows, screens, permissions, and backend integration will be
              implemented incrementally without changing the workspace
              structure.
            </p>
          </section>
        )}
      </section>
    </WorkspaceShell>
  )
}
