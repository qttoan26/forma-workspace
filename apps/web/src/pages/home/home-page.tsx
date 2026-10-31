import { isDemoMode, startLogout } from '@/shared/auth/auth-session'
import { workspaceModules } from '@/shared/workspace/module-registry'
import { WorkspaceNavbar } from '@/widgets/workspace-navbar/workspace-navbar'

import './home-auth.css'
import './home-page.css'
import './home-modules.css'

const appBaseUrl = import.meta.env.BASE_URL
const projectHref = `${appBaseUrl}workspaces/forma/projects/project-1`

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

const metrics = [
  { label: 'Open tasks', value: '3', detail: '1 urgent' },
  { label: 'In progress', value: '1', detail: 'Across 1 project' },
  { label: 'Team members', value: '3', detail: 'Design · Frontend · Product' },
]

export function HomePage() {
  const demoMode = isDemoMode()

  return (
    <main className="dashboard-shell" id="main-content">
      <header className="dashboard-topbar">
        <a
          className="dashboard-brand"
          href={appBaseUrl}
          aria-label="Forma Workspace home"
        >
          <span className="dashboard-brand-mark" aria-hidden="true">
            F
          </span>
          <span>Forma</span>
        </a>
        <div className="dashboard-account" aria-label="Signed in user">
          <span className="dashboard-account-copy">
            <strong>Sam Lee</strong>
            <small>Frontend</small>
          </span>
          <span className="dashboard-avatar" aria-hidden="true">
            SL
          </span>
          {demoMode ? (
            <span className="dashboard-demo-badge">Demo mode</span>
          ) : (
            <button
              className="dashboard-sign-out"
              type="button"
              onClick={startLogout}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <WorkspaceNavbar />

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        <div className="dashboard-intro">
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1 id="dashboard-title">Keep the work moving.</h1>
            <p className="dashboard-lead">
              Run work from one workspace across execution, production,
              documents, automation, vendors, customers, and governance.
            </p>
          </div>
          <a className="dashboard-primary-action" href={projectHref}>
            Open project board
          </a>
        </div>

        <section className="workspace-module-section" aria-labelledby="modules-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workspace modules</p>
              <h2 id="modules-title">Operational areas</h2>
            </div>
            <span className="panel-count">Structure first</span>
          </div>

          <div className="workspace-module-grid">
            {workspaceModules.map((module) => (
              <a
                className="workspace-module-card"
                href={hrefFor(module.path)}
                key={module.id}
              >
                <span className="workspace-module-card-topline">
                  <span className="workspace-module-eyebrow">{module.eyebrow}</span>
                  <span
                    className={`workspace-module-status workspace-module-status-${module.status}`}
                  >
                    {module.status === 'available' ? 'Available' : 'Implementing'}
                  </span>
                </span>
                <strong>{module.label}</strong>
                <p>{module.description}</p>
                <span className="workspace-module-open">Open module →</span>
              </a>
            ))}
          </div>
        </section>

        <section className="metric-grid" aria-label="Workspace summary">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        <div className="dashboard-grid">
          <section className="dashboard-panel" aria-labelledby="projects-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Active work</p>
                <h2 id="projects-title">Projects</h2>
              </div>
              <span className="panel-count">1 active</span>
            </div>

            <a className="project-overview-card" href={projectHref}>
              <div className="project-overview-main">
                <span className="project-key">FOR</span>
                <div>
                  <h3>Product launch</h3>
                  <p>
                    Ship the first production-ready Forma Workspace experience.
                  </p>
                </div>
              </div>
              <div
                className="project-progress"
                aria-label="Project progress 25 percent"
              >
                <span>
                  <strong>25%</strong> complete
                </span>
                <span className="progress-track" aria-hidden="true">
                  <span />
                </span>
              </div>
              <div className="project-overview-footer">
                <span>4 tasks</span>
                <span>3 members</span>
                <span aria-hidden="true">→</span>
              </div>
            </a>
          </section>

          <aside className="dashboard-panel" aria-labelledby="attention-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Today</p>
                <h2 id="attention-title">Needs attention</h2>
              </div>
            </div>

            <div className="attention-list">
              <a href={`${projectHref}?task=FOR-21`} className="attention-item">
                <span className="attention-priority attention-priority-urgent">
                  Urgent
                </span>
                <span>
                  <strong>Build accessible task cards</strong>
                  <small>Overdue · Product launch</small>
                </span>
              </a>
              <a href={`${projectHref}?task=FOR-18`} className="attention-item">
                <span className="attention-priority attention-priority-high">
                  High
                </span>
                <span>
                  <strong>Create board interaction model</strong>
                  <small>Due today · Product launch</small>
                </span>
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
