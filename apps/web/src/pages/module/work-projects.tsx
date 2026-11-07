import { useState } from 'react'
import type { Project } from '@/entities/project/model/project'
import { projectHref } from '@/entities/project/lib/project-href'
import { isTaskOverdue } from '@/entities/task/model/task'
import { ProjectCreateForm } from '@/features/project-create/ui/project-create-form'
import {
  projectViewLabels,
  projectViews,
} from '@/pages/project-board/project-view'
import { project, workspace } from '@/pages/project-board/project-board-data'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { localDateKey } from '@/shared/lib/local-date-key'
import { useProjectCatalog } from './use-project-catalog'
import { useWorkData } from './use-work-data'
import './work-projects.css'

export function WorkProjects({
  accountId,
  query,
  onQueryChange,
}: {
  accountId?: string | undefined
  query: string
  onQueryChange: (query: string) => void
}) {
  const catalog = useProjectCatalog(accountId)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const normalized = query.trim().toLocaleLowerCase()
  const visible = catalog.projects.filter((candidate) =>
    `${candidate.name} ${candidate.key} ${candidate.description}`
      .toLocaleLowerCase()
      .includes(normalized),
  )
  return (
    <section
      className="work-surface project-catalog"
      aria-label="Project catalog"
    >
      <div className="project-catalog-toolbar">
        <label>
          Search projects
          <input
            type="search"
            placeholder="Name, key or description"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="module-primary-action"
          disabled={catalog.loading || catalog.error || !catalog.scope}
          onClick={() => {
            setNotice('')
            setCreating(true)
          }}
        >
          New project
        </button>
      </div>
      <p className="work-data-context">
        Projects you create are saved for your account on this browser. New
        projects start with no tasks or assigned members.
      </p>
      {catalog.loading ? <p role="status">Loading saved projects…</p> : null}
      {catalog.error ? (
        <div className="work-empty-state" role="alert">
          <p>
            Saved projects could not be loaded. Allow browser storage and try
            again. The sample project remains available.
          </p>
          <button
            className="button-secondary"
            type="button"
            onClick={catalog.retry}
          >
            Try again
          </button>
        </div>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      <div className="work-task-results">
        <p role="status">
          Showing {visible.length} of {catalog.projects.length} projects
        </p>
        {query ? (
          <button
            className="button-secondary"
            type="button"
            onClick={() => onQueryChange('')}
          >
            Clear search
          </button>
        ) : null}
      </div>
      {visible.length ? (
        <ScrollRegion label="Project list" className="project-catalog-list">
          {visible.map((candidate) => (
            <ProjectRow
              key={candidate.id}
              project={candidate}
              accountId={catalog.scope?.accountId}
            />
          ))}
        </ScrollRegion>
      ) : (
        <div className="work-empty-state">
          <h2>No matching projects</h2>
          <p>Try another name or key, or clear your search.</p>
        </div>
      )}
      {creating && catalog.scope ? (
        <ProjectCreateForm
          key={catalog.scope.accountId}
          scope={catalog.scope}
          reservedKeys={[project.key]}
          onDismiss={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            setNotice('Project created. Open it from the project list.')
            onQueryChange('')
            catalog.retry()
          }}
        />
      ) : null}
    </section>
  )
}

function ProjectRow({
  project,
  accountId,
}: {
  project: Project
  accountId?: string | undefined
}) {
  const { data, error, retry } = useWorkData(project.id, accountId)
  const tasks = data?.initialTasks ?? []
  const completed = tasks.filter((task) => task.status === 'done').length
  const completion = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0
  const href = projectHref(workspace.slug, project.id)
  return (
    <article className="work-panel work-project-row" aria-label={project.name}>
      <span className="work-project-mark">{project.key}</span>
      <div className="work-project-row-main">
        <h2>{project.name}</h2>
        <p>{project.description || 'No description yet.'}</p>
        {error ? (
          <p role="alert">
            Task summary unavailable.{' '}
            <button type="button" className="button-secondary" onClick={retry}>
              Retry summary
            </button>
          </p>
        ) : data ? (
          <>
            <span>
              {tasks.length} tasks · {data.members.length} members ·{' '}
              {completion}% complete
            </span>
            <div className="work-project-progress">
              <progress
                aria-label="Project task completion"
                max={100}
                value={completion}
              />
              <small>
                {tasks.length - completed} open ·{' '}
                {
                  tasks.filter((task) => isTaskOverdue(task, localDateKey()))
                    .length
                }{' '}
                overdue
              </small>
            </div>
          </>
        ) : (
          <p role="status">Loading task summary…</p>
        )}
        <nav className="work-project-views" aria-label="Open project view">
          {projectViews.map((view) => (
            <a
              key={view}
              href={`${href}${view === 'board' ? '' : `?view=${view}`}`}
            >
              {projectViewLabels[view]}
            </a>
          ))}
        </nav>
      </div>
      <a className="module-primary-action" href={href}>
        Open project
      </a>
    </article>
  )
}
