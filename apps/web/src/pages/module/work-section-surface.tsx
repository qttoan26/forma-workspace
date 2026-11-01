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

function TaskTable({ tasks, data }: { tasks: Task[]; data: ProjectBoardData }) {
  if (!tasks.length)
    return <p className="work-empty-state">No tasks to display.</p>
  return (
    <div className="work-data-table" role="table" aria-label="Tasks">
      <div className="work-data-table-row is-header" role="row">
        <span role="columnheader">Task</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Due</span>
        <span role="columnheader">Owner</span>
      </div>
      {tasks.map((task) => (
        <div className="work-data-table-row" role="row" key={task.id}>
          <span className="work-task-main" role="cell">
            <small>{task.id}</small>
            <a href={`${projectHref}?task=${encodeURIComponent(task.id)}`}>
              {task.title}
            </a>
            <em>{data.project.name}</em>
          </span>
          <span role="cell">
            <span className="work-status-chip">
              {taskStatusLabels[task.status]}
            </span>
          </span>
          <span role="cell">{task.dueDate ?? 'No due date'}</span>
          <span role="cell">
            {data.members.find((member) => member.id === task.assigneeId)
              ?.name ?? 'Unassigned'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function WorkSectionSurface({ section }: { section: WorkSection }) {
  if (section.status === 'implementation')
    return (
      <section
        className="module-state-card"
        aria-label={`${section.label} implementation status`}
      >
        <h2>What will appear here</h2>
        <p>
          {section.id === 'inbox'
            ? 'Assignment notifications and mentions will appear here when notifications are connected.'
            : section.id === 'activity'
              ? 'Workspace-wide events will appear here when the activity feed is connected. Task comments are available inside each task.'
              : 'Team membership and responsibilities are managed in Admin.'}
        </p>
      </section>
    )
  return <WorkSectionDataSurface section={section} />
}

function WorkSectionDataSurface({ section }: { section: WorkSection }) {
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
  const mine = tasks.filter((task) => task.assigneeId === userId)
  const completed = tasks.filter((task) => task.status === 'done').length
  const completion = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0
  const datedTasks = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))

  return (
    <section className="work-surface" aria-label={`${section.label} details`}>
      {isDemoMode() ? (
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
      {section.id === 'tasks' ? <TaskTable tasks={tasks} data={data} /> : null}
      {section.id === 'my-tasks' ? (
        <>
          <p className="work-data-context">
            {data.members.find((member) => member.id === userId)?.name ??
              'Your account is not linked to a project member yet.'}
          </p>
          {data.members.some((member) => member.id === userId) ? (
            <TaskTable tasks={mine} data={data} />
          ) : (
            <p className="work-empty-state">
              Personal assignments will be shown once your account is linked.
            </p>
          )}
        </>
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
            <div className="work-agenda-list">
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
            </div>
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
