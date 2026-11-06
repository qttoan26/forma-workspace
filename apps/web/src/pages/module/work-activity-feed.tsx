import { useEffect, useState } from 'react'
import { loadProjectActivityFromIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { subscribeTaskActivity } from '@/entities/task/lib/task-activity-events'
import type { TaskActivityEntry } from '@/entities/task/model/task-activity'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'

const projectHref = `${import.meta.env.BASE_URL}workspaces/forma/projects/project-1`

export function WorkActivityFeed({ data }: { data: ProjectBoardData }) {
  const [state, setState] = useState<{
    entries: TaskActivityEntry[]
    status: 'loading' | 'ready' | 'error'
  }>({ entries: [], status: 'loading' })
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(50)
  const [attempt, setAttempt] = useState(0)
  const taskIdsKey = JSON.stringify(data.initialTasks.map((task) => task.id))
  useEffect(() => {
    let active = true
    let revision = 0
    async function load() {
      const request = ++revision
      try {
        const entries = await loadProjectActivityFromIndexedDb(
          data.project.id,
          JSON.parse(taskIdsKey) as string[],
        )
        if (active && request === revision)
          setState({ entries, status: 'ready' })
      } catch {
        if (active && request === revision)
          setState({ entries: [], status: 'error' })
      }
    }
    void load()
    const unsubscribe = subscribeTaskActivity(data.project.id, () => {
      void load()
    })
    const onFocus = () => {
      void load()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [data.project.id, taskIdsKey, attempt])
  const tasks = new Map(data.initialTasks.map((task) => [task.id, task]))
  const normalized = query.trim().toLocaleLowerCase()
  const filtered = state.entries.filter(
    (entry) =>
      (kind === 'all' || entry.kind === kind) &&
      (!normalized ||
        [
          entry.body,
          entry.taskId,
          tasks.get(entry.taskId)?.title,
          entry.authorLabel,
        ].some((value) => value?.toLocaleLowerCase().includes(normalized))),
  )
  return (
    <section className="work-panel" aria-label="Saved project activity">
      <div className="work-panel-heading">
        <div>
          <h2>Recent activity</h2>
          <p className="work-heading-meta">
            {data.project.name} · Saved on this browser
          </p>
        </div>
        <button
          className="button-secondary"
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Refresh activity
        </button>
      </div>
      <p className="work-activity-context">
        Comments, task detail changes, checklist updates and linked-file changes
        saved on this browser. This feed covers the current project.
      </p>
      <form
        className="work-task-filters work-activity-filters"
        aria-label="Filter activity"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="work-task-search">
          Search activity
          <input
            type="search"
            placeholder="Task or update"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setLimit(50)
            }}
          />
        </label>
        <label>
          Activity type
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value)
              setLimit(50)
            }}
          >
            <option value="all">All activity</option>
            <option value="comment">Comments</option>
            <option value="event">Task updates</option>
          </select>
        </label>
      </form>
      {state.status === 'loading' ? (
        <p className="work-activity-context" role="status">
          Loading activity…
        </p>
      ) : state.status === 'error' ? (
        <div className="work-empty-state" role="alert">
          Activity could not be loaded. Allow browser storage and try Refresh
          activity.
        </div>
      ) : (
        <>
          <p className="work-activity-context" role="status">
            {filtered.length} saved{' '}
            {filtered.length === 1 ? 'update' : 'updates'}
          </p>
          {filtered.length ? (
            <ScrollRegion label="Project activity feed">
              <ol className="work-activity-list">
                {filtered.slice(0, limit).map((entry) => (
                  <li key={entry.id}>
                    <span className="work-activity-marker" aria-hidden="true">
                      {entry.kind === 'comment' ? 'C' : 'U'}
                    </span>
                    <div>
                      <div className="work-activity-meta">
                        <strong>{entry.authorLabel ?? 'Task update'}</strong>
                        <span>
                          {entry.kind === 'comment' ? 'Comment' : 'Task update'}
                        </span>
                        <time dateTime={entry.createdAt}>
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(entry.createdAt))}
                        </time>
                      </div>
                      <a
                        href={`${projectHref}?task=${encodeURIComponent(entry.taskId)}`}
                      >
                        {tasks.get(entry.taskId)?.title ?? entry.taskId}
                      </a>
                      <p>{entry.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollRegion>
          ) : (
            <div className="work-empty-state">
              <strong>
                {state.entries.length
                  ? 'No matching activity'
                  : 'No saved activity yet'}
              </strong>
              <p>
                {state.entries.length
                  ? 'Try another search or activity type.'
                  : 'Open a task and add a comment or update its details to start the feed.'}
              </p>
              <a href={projectHref}>Open project</a>
            </div>
          )}
          {filtered.length > limit ? (
            <div className="work-task-results">
              <button
                className="button-secondary"
                type="button"
                onClick={() => setLimit((value) => value + 50)}
              >
                Show more activity
              </button>
              <span>
                Showing {limit} of {filtered.length}
              </span>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
