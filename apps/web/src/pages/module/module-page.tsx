import { getWorkspaceModule } from '@/shared/workspace/module-registry'
import { WorkspaceShell } from '@/widgets/workspace-shell/workspace-shell'

import './module-page.css'

const appBaseUrl = import.meta.env.BASE_URL
const projectHref = `${appBaseUrl}workspaces/forma/projects/project-1`

const workSections = [
  {
    id: 'projects',
    label: 'Projects',
    description: 'Boards, delivery and project execution',
    status: 'available',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Cross-project task management',
    status: 'implementation',
  },
  {
    id: 'my-work',
    label: 'My Work',
    description: 'Personal priorities and assignments',
    status: 'implementation',
  },
  {
    id: 'calendar',
    label: 'Calendar & Activity',
    description: 'Deadlines, events and activity stream',
    status: 'implementation',
  },
] as const

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
          <div className="work-module-layout">
            <aside className="work-subnav" aria-label="Work sections">
              <div className="work-subnav-heading">
                <span>Work</span>
                <small>Execution</small>
              </div>
              <nav className="work-subnav-list">
                {workSections.map((section) =>
                  section.status === 'available' ? (
                    <a
                      className="work-subnav-item is-active"
                      href={projectHref}
                      key={section.id}
                    >
                      <span>
                        <strong>{section.label}</strong>
                        <small>{section.description}</small>
                      </span>
                      <span className="work-subnav-count">1</span>
                    </a>
                  ) : (
                    <div
                      className="work-subnav-item is-disabled"
                      key={section.id}
                      aria-label={`${section.label}, implementation in progress`}
                    >
                      <span>
                        <strong>{section.label}</strong>
                        <small>{section.description}</small>
                      </span>
                      <span className="work-subnav-state">Soon</span>
                    </div>
                  ),
                )}
              </nav>
            </aside>

            <div className="work-module-main">
              <section className="module-state-card work-project-card">
                <div className="work-project-card-header">
                  <div>
                    <p className="eyebrow">Projects</p>
                    <h2>Project execution is connected.</h2>
                    <p>
                      The existing project board is the first production-ready
                      Work experience. The remaining Work sections are being
                      implemented incrementally around the same execution model.
                    </p>
                  </div>
                  <span className="work-project-key">FOR</span>
                </div>

                <div className="work-project-summary" aria-label="Project summary">
                  <span>
                    <strong>1</strong>
                    <small>Active project</small>
                  </span>
                  <span>
                    <strong>4</strong>
                    <small>Tasks</small>
                  </span>
                  <span>
                    <strong>3</strong>
                    <small>Members</small>
                  </span>
                </div>

                <a className="module-primary-action" href={projectHref}>
                  Open project board
                </a>
              </section>

              <section className="work-roadmap" aria-labelledby="work-roadmap-title">
                <div>
                  <p className="eyebrow">Next in Work</p>
                  <h2 id="work-roadmap-title">Implementation in progress</h2>
                </div>
                <div className="work-roadmap-items">
                  <span>Tasks</span>
                  <span>My Work</span>
                  <span>Calendar & Activity</span>
                </div>
              </section>
            </div>
          </div>
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
