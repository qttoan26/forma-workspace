import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { WorkInsightsPanel } from '@/widgets/work-insights/work-insights-panel'
import { useWorkData } from '@/pages/module/use-work-data'

import { workspaceModules } from '@/shared/workspace/module-registry'
import { WorkspaceShell } from '@/widgets/workspace-shell/workspace-shell'

import './home-page.css'
import './home-modules.css'

const appBaseUrl = import.meta.env.BASE_URL
const projectHref = `${appBaseUrl}workspaces/forma/projects/project-1`

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

export function HomePage() {
  const { data, error, retry } = useWorkData()
  const tasks = data?.initialTasks ?? []
  const completed = tasks.filter((task) => task.status === 'done').length
  const completion = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0
  const metrics = [
    {
      label: 'Open tasks',
      value: data ? String(tasks.length - completed) : '—',
      detail: 'Current project',
    },
    {
      label: 'In progress',
      value: data
        ? String(tasks.filter((task) => task.status === 'in-progress').length)
        : '—',
      detail: 'Current project',
    },
    {
      label: 'Project members',
      value: data ? String(data.members.length) : '—',
      detail: 'Current project',
    },
  ]
  const attentionTasks = tasks.filter(
    (task) =>
      task.status !== 'done' &&
      (task.priority === 'urgent' || task.priority === 'high'),
  )
  return (
    <WorkspaceShell pageLabel="Overview">
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

        {error ? (
          <p role="alert">
            Work summary could not be loaded.{' '}
            <button type="button" onClick={retry}>
              Try again
            </button>
          </p>
        ) : null}
        <section className="metric-grid" aria-label="Workspace summary">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        {data && !error ? (
          <WorkInsightsPanel
            tasks={tasks}
            members={data.members}
            projectName={data.project.name}
          />
        ) : null}

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
                  <h3>{data?.project.name ?? 'Loading project…'}</h3>
                  <p>
                    {data?.project.description ?? 'Loading project details…'}
                  </p>
                </div>
              </div>
              <div
                className="project-progress"
                aria-label={
                  data
                    ? `Project progress ${completion} percent`
                    : 'Loading project progress'
                }
              >
                <span>
                  <strong>{data ? `${completion}%` : '—'}</strong> complete
                </span>
                <span className="progress-track" aria-hidden="true">
                  <span style={{ width: `${completion}%` }} />
                </span>
              </div>
              <div className="project-overview-footer">
                <span>{data ? tasks.length : '—'} tasks</span>
                <span>{data ? data.members.length : '—'} members</span>
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

            <ScrollRegion
              label="Tasks needing attention"
              className="attention-list"
            >
              {attentionTasks.map((task) => (
                <a
                  href={`${projectHref}?task=${encodeURIComponent(task.id)}`}
                  className="attention-item"
                  key={task.id}
                >
                  <span
                    className={`attention-priority attention-priority-${task.priority}`}
                  >
                    {task.priority}
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.dueDate ?? 'No due date'} · {data?.project.name}
                    </small>
                  </span>
                </a>
              ))}
              {data && !attentionTasks.length ? (
                <p>No urgent or high-priority tasks.</p>
              ) : null}
            </ScrollRegion>
          </aside>
        </div>
        <section
          className="workspace-module-section"
          aria-labelledby="modules-title"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workspace modules</p>
              <h2 id="modules-title">Operational areas</h2>
            </div>
            <span className="panel-count">8 modules</span>
          </div>

          <div className="workspace-module-grid">
            {workspaceModules.map((module) => (
              <a
                className="workspace-module-card"
                href={hrefFor(module.path)}
                key={module.id}
              >
                <span className="workspace-module-card-topline">
                  <span className="workspace-module-eyebrow">
                    {module.eyebrow}
                  </span>
                  <span
                    className={`workspace-module-status workspace-module-status-${module.status}`}
                  >
                    {module.status === 'available'
                      ? 'Available'
                      : 'Implementing'}
                  </span>
                </span>
                <strong>{module.label}</strong>
                <p>{module.description}</p>
                <span className="workspace-module-open">Open module →</span>
              </a>
            ))}
          </div>
        </section>
      </section>
    </WorkspaceShell>
  )
}
