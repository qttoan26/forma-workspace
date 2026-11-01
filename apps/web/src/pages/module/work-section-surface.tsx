import { lazy, Suspense, useState } from 'react'
import { WorkTaskExplorer } from './work-task-explorer'
import { WorkActivityFeed } from './work-activity-feed'
import {
  defaultWorkTaskSearch,
  isTaskOverdue,
  localDateKey,
  type WorkTaskSearch,
} from './work-task-filters'
import {
  projectViews,
  projectViewLabels,
} from '@/pages/project-board/project-view'
import { WorkInsightsPanel } from '@/widgets/work-insights/work-insights-panel'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import type { Task } from '@/entities/task/model/task'
import { taskStatusLabels } from '@/entities/task/model/task'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import { useWorkData } from '@/pages/module/use-work-data'
import type { WorkSection } from '@/shared/workspace/work-section-registry'
import { workSectionPath } from '@/shared/workspace/work-section-registry'
import { isDemoMode } from '@/shared/auth/auth-session'

import './work-section-surface.css'

const appBaseUrl = import.meta.env.BASE_URL
const projectHref = `${appBaseUrl}workspaces/forma/projects/project-1`

const WorkInbox = lazy(() =>
  import('./work-inbox').then((module) => ({ default: module.WorkInbox })),
)

const SharedTaskTable = lazy(() =>
  import('@/widgets/task-table/task-table').then((module) => ({
    default: module.TaskTable,
  })),
)

function TaskTable({ tasks, data }: { tasks: Task[]; data: ProjectBoardData }) {
  return (
    <Suspense fallback={<p role="status">Loading task table…</p>}>
      <SharedTaskTable
        tasks={tasks}
        members={data.members}
        getTaskHref={(taskId) =>
          `${projectHref}?task=${encodeURIComponent(taskId)}`
        }
        emptyMessage="No tasks to display."
      />
    </Suspense>
  )
}

export function WorkSectionSurface({
  section,
  taskSearch,
  onTaskSearchChange,
}: {
  section: WorkSection
  taskSearch?: WorkTaskSearch | undefined
  onTaskSearchChange?: ((search: WorkTaskSearch) => void) | undefined
}) {
  const [localSearch, setLocalSearch] = useState(defaultWorkTaskSearch)
  if (section.status === 'implementation')
    return (
      <section
        className="module-state-card"
        aria-label={`${section.label} implementation status`}
      >
        <h2>What will appear here</h2>
        <p>
          {section.id === 'activity'
            ? 'Workspace-wide events will appear here when the activity feed is connected. Task comments are available inside each task.'
            : 'Team membership and responsibilities are managed in Admin.'}
        </p>
      </section>
    )
  return (
    <WorkSectionDataSurface
      section={section}
      taskSearch={taskSearch ?? localSearch}
      onTaskSearchChange={onTaskSearchChange ?? setLocalSearch}
    />
  )
}

function WorkSectionDataSurface({
  section,
  taskSearch,
  onTaskSearchChange,
}: {
  section: WorkSection
  taskSearch: WorkTaskSearch
  onTaskSearchChange: (search: WorkTaskSearch) => void
}) {
  const { data, error, userId, retry } = useWorkData()
  if (error)
    return (
      <section className="module-state-card" role="alert">
        <h2>Work could not be loaded</h2>
        <p>Try loading the current project again.</p>
        <button type="button" className="module-primary-action" onClick={retry}>
          Try again
        </button>
      </section>
    )
  if (!data) return <p role="status">Loading current work…</p>

  const tasks = data.initialTasks
  const completed = tasks.filter((task) => task.status === 'done').length
  const completion = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0
  const datedTasks = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))

  return (
    <section className="work-surface" aria-label={`${section.label} details`}>
      {isDemoMode() && section.id !== 'inbox' ? (
        <p className="work-data-context">
          Demo workspace · Uses the same saved tasks as the project board.
        </p>
      ) : null}
      {section.id === 'overview' ? (
        <>
          <section className="work-metric-grid" aria-label="Work summary">
            <article>
              <small>Open tasks</small>
              <strong>{tasks.length - completed}</strong>
              <span>In the current project</span>
            </article>
            <article>
              <small>In progress</small>
              <strong>
                {tasks.filter((task) => task.status === 'in-progress').length}
              </strong>
              <span>Tasks being worked on</span>
            </article>
            <article>
              <small>Completed</small>
              <strong>{completed}</strong>
              <span>{completion}% of tasks</span>
            </article>
            <article>
              <small>Project members</small>
              <strong>{data.members.length}</strong>
              <span>{data.project.name}</span>
            </article>
          </section>
          <WorkInsightsPanel
            tasks={tasks}
            members={data.members}
            projectName={data.project.name}
          />
          <section className="work-panel">
            <div className="work-panel-heading">
              <h2>Current tasks</h2>
              <a href={`${appBaseUrl}${workSectionPath('tasks').slice(1)}`}>
                View all tasks
              </a>
            </div>
            <TaskTable
              tasks={tasks.filter((task) => task.status !== 'done')}
              data={data}
            />
          </section>
        </>
      ) : null}
      {section.id === 'tasks' ? (
        <WorkTaskExplorer
          data={data}
          userId={userId}
          search={taskSearch}
          onSearchChange={onTaskSearchChange}
        />
      ) : null}
      {section.id === 'my-tasks' ? (
        <>
          <p className="work-data-context">
            {data.members.find((member) => member.id === userId)?.name ??
              'Your account is not linked to a project member yet.'}
          </p>
          {data.members.some((member) => member.id === userId) ? (
            <WorkTaskExplorer
              data={data}
              userId={userId}
              personal
              search={taskSearch}
              onSearchChange={onTaskSearchChange}
            />
          ) : (
            <p className="work-empty-state">
              Personal assignments will be shown once your account is linked.
            </p>
          )}
        </>
      ) : null}
      {section.id === 'activity' ? <WorkActivityFeed data={data} /> : null}
      {section.id === 'inbox' ? (
        <Suspense fallback={<p role="status">Loading inbox…</p>}>
          <WorkInbox data={data} userId={userId} />
        </Suspense>
      ) : null}
      {section.id === 'projects' ? (
        <section className="work-panel">
          <article className="work-project-row">
            <span className="work-project-mark">{data.project.key}</span>
            <div className="work-project-row-main">
              <h2>{data.project.name}</h2>
              <p>{data.project.description}</p>
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
              <nav
                className="work-project-views"
                aria-label="Open project view"
              >
                {projectViews.map((view) => (
                  <a
                    key={view}
                    href={`${projectHref}${view === 'board' ? '' : `?view=${view}`}`}
                  >
                    {projectViewLabels[view]}
                  </a>
                ))}
              </nav>
            </div>
            <a className="module-primary-action" href={projectHref}>
              Open project
            </a>
          </article>
        </section>
      ) : null}
      {section.id === 'calendar' || section.id === 'timeline' ? (
        <section className="work-panel">
          <div className="work-panel-heading">
            <h2>
              {section.id === 'calendar'
                ? 'Task deadlines'
                : 'Delivery sequence'}
            </h2>
            <a href={`${projectHref}?view=${section.id}`}>
              Open project {section.id}
            </a>
          </div>
          <p className="work-data-context">
            Scheduled by task due date. {tasks.length - datedTasks.length} tasks
            have no due date.
          </p>
          {datedTasks.length ? (
            <ScrollRegion
              label="Task deadline list"
              className="work-agenda-list"
            >
              {datedTasks.map((task) => (
                <article key={task.id}>
                  <span>{task.dueDate}</span>
                  <a
                    href={`${projectHref}?view=${section.id}&task=${encodeURIComponent(task.id)}`}
                  >
                    {task.title}
                  </a>
                  <small>{taskStatusLabels[task.status]}</small>
                </article>
              ))}
            </ScrollRegion>
          ) : (
            <p className="work-empty-state">
              Add due dates to tasks to see the schedule.
            </p>
          )}
        </section>
      ) : null}
      {section.id === 'members' ? (
        <div className="work-team-grid">
          {data.members.map((member) => (
            <article className="work-person-card" key={member.id}>
              <span className="work-person-avatar">{member.initials}</span>
              <strong>{member.name}</strong>
              <small>{member.role}</small>
              <p>
                {tasks.filter((task) => task.assigneeId === member.id).length}{' '}
                assigned tasks
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
