import './home-page.css'

const projectHref = '/workspaces/forma/projects/project-1'

const metrics = [
  { label: 'Open tasks', value: '3', detail: '1 urgent' },
  { label: 'In progress', value: '1', detail: 'Across 1 project' },
  { label: 'Team members', value: '3', detail: 'Design · Frontend · Product' },
]

export function HomePage() {
  return (
    <main className="dashboard-shell" id="main-content">
      <header className="dashboard-topbar">
        <a className="dashboard-brand" href="/" aria-label="Forma Workspace home">
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
        </div>
      </header>

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        <div className="dashboard-intro">
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1 id="dashboard-title">Keep the work moving.</h1>
            <p className="dashboard-lead">
              Focus on what needs attention, open your active project, and keep
              the team aligned without losing context.
            </p>
          </div>
          <a className="dashboard-primary-action" href={projectHref}>
            Open project board
          </a>
        </div>

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
                  <p>Ship the first production-ready Forma Workspace experience.</p>
                </div>
              </div>
              <div className="project-progress" aria-label="Project progress 25 percent">
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
                <span className="attention-priority attention-priority-high">High</span>
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
