import type { Member } from '@/entities/member/model/member'
import {
  taskStatuses,
  taskStatusLabels,
  type Task,
} from '@/entities/task/model/task'
import { filterTasks } from '@/widgets/task-board/model/task-board-view'

import {
  ProjectLiveTaskBoard,
  type ProjectLiveTaskBoardProps,
} from './project-live-task-board'
import type { ProjectView } from './project-view'
import { useProjectLiveTasks } from './use-project-live-tasks'
import './project-task-views.css'

interface ProjectTaskViewsProps extends ProjectLiveTaskBoardProps {
  view: ProjectView
}

export function ProjectTaskViews(props: ProjectTaskViewsProps) {
  if (props.view === 'board') {
    return <ProjectLiveTaskBoard {...props} />
  }

  return <ProjectReadOnlyTaskView {...props} />
}

function ProjectReadOnlyTaskView({
  view,
  projectId,
  initialTasks,
  members,
  filters,
}: ProjectTaskViewsProps) {
  const snapshot = useProjectLiveTasks(projectId, initialTasks)
  const tasks = filterTasks(snapshot.tasks, filters)

  switch (view) {
    case 'list':
      return <ProjectListView tasks={tasks} members={members} />
    case 'table':
      return <ProjectTableView tasks={tasks} members={members} />
    case 'calendar':
      return <ProjectCalendarView tasks={tasks} members={members} />
    case 'timeline':
      return <ProjectTimelineView tasks={tasks} members={members} />
    case 'files':
      return <ProjectFilesView taskCount={snapshot.tasks.length} />
    default:
      return null
  }
}

function ProjectListView({ tasks, members }: TaskViewProps) {
  const memberById = createMemberMap(members)

  return (
    <section className="project-view-surface" aria-label="Project task list">
      <ProjectViewHeading
        eyebrow="Task list"
        title="Work grouped by status"
        meta={`${tasks.length} tasks`}
      />
      <div className="project-list-groups">
        {taskStatuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)

          return (
            <section className="project-list-group" key={status}>
              <header>
                <strong>{taskStatusLabels[status]}</strong>
                <span>{statusTasks.length}</span>
              </header>
              {statusTasks.length ? (
                statusTasks.map((task) => (
                  <article className="project-list-task" key={task.id}>
                    <span className="project-task-key">{task.id}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {task.priority} priority
                        {task.dueDate ? ` · Due ${task.dueDate}` : ''}
                      </small>
                    </div>
                    <TaskAssignee
                      member={
                        task.assigneeId
                          ? memberById.get(task.assigneeId)
                          : undefined
                      }
                    />
                  </article>
                ))
              ) : (
                <p className="project-view-empty-row">
                  No tasks in this status.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}

function ProjectTableView({ tasks, members }: TaskViewProps) {
  const memberById = createMemberMap(members)

  return (
    <section className="project-view-surface" aria-label="Project task table">
      <ProjectViewHeading
        eyebrow="Task table"
        title="Dense project inventory"
        meta={`${tasks.length} rows`}
      />
      <div className="project-table-wrap">
        <div className="project-task-table" role="table" aria-label="Tasks">
          <div className="project-task-table-row is-header" role="row">
            <span role="columnheader">ID</span>
            <span role="columnheader">Task</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Priority</span>
            <span role="columnheader">Assignee</span>
            <span role="columnheader">Due</span>
          </div>
          {tasks.map((task) => (
            <div className="project-task-table-row" role="row" key={task.id}>
              <span className="project-task-key" role="cell">
                {task.id}
              </span>
              <strong role="cell">{task.title}</strong>
              <span role="cell">{taskStatusLabels[task.status]}</span>
              <span role="cell">{task.priority}</span>
              <span role="cell">
                {task.assigneeId
                  ? (memberById.get(task.assigneeId)?.name ?? 'Unassigned')
                  : 'Unassigned'}
              </span>
              <span role="cell">{task.dueDate ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCalendarView({ tasks, members }: TaskViewProps) {
  const memberById = createMemberMap(members)
  const orderedTasks = [...tasks].sort(compareTaskDueDate)

  return (
    <section className="project-view-surface" aria-label="Project calendar">
      <ProjectViewHeading
        eyebrow="Calendar"
        title="Due-date schedule"
        meta={`${tasks.filter((task) => task.dueDate).length} scheduled`}
      />
      <div className="project-calendar-list">
        {orderedTasks.map((task) => (
          <article className="project-calendar-item" key={task.id}>
            <div className="project-calendar-date">
              <strong>{task.dueDate ?? 'Unscheduled'}</strong>
              <small>{taskStatusLabels[task.status]}</small>
            </div>
            <div className="project-calendar-task">
              <span className="project-task-key">{task.id}</span>
              <strong>{task.title}</strong>
              <small>{task.priority} priority</small>
            </div>
            <TaskAssignee
              member={
                task.assigneeId ? memberById.get(task.assigneeId) : undefined
              }
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectTimelineView({ tasks, members }: TaskViewProps) {
  const memberById = createMemberMap(members)
  const orderedTasks = [...tasks].sort(compareTaskDueDate)

  return (
    <section className="project-view-surface" aria-label="Project timeline">
      <ProjectViewHeading
        eyebrow="Timeline"
        title="Delivery sequence"
        meta={`${tasks.length} tasks`}
      />
      <div className="project-timeline-list">
        {orderedTasks.map((task, index) => (
          <article className="project-timeline-item" key={task.id}>
            <span className="project-timeline-marker" aria-hidden="true">
              {index + 1}
            </span>
            <div className="project-timeline-copy">
              <span className="project-task-key">{task.id}</span>
              <strong>{task.title}</strong>
              <small>
                {taskStatusLabels[task.status]} · {task.priority} priority
              </small>
            </div>
            <div className="project-timeline-meta">
              <strong>{task.dueDate ?? 'No due date'}</strong>
              <small>
                {task.assigneeId
                  ? (memberById.get(task.assigneeId)?.name ?? 'Unassigned')
                  : 'Unassigned'}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectFilesView({ taskCount }: { taskCount: number }) {
  return (
    <section className="project-view-surface project-files-surface">
      <ProjectViewHeading
        eyebrow="Files"
        title="Project documents"
        meta={`${taskCount} linked tasks`}
      />
      <div className="project-files-empty">
        <span aria-hidden="true">F</span>
        <div>
          <strong>Files workspace is ready for integration.</strong>
          <p>
            The project view boundary is in place. Uploads, task attachments,
            document versions, and provider storage will be connected without
            changing the project navigation structure.
          </p>
        </div>
      </div>
    </section>
  )
}

function ProjectViewHeading({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string
  title: string
  meta: string
}) {
  return (
    <header className="project-view-heading">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
      <span>{meta}</span>
    </header>
  )
}

function TaskAssignee({ member }: { member?: Member | undefined }) {
  if (!member) {
    return <span className="project-task-unassigned">—</span>
  }

  return (
    <span
      className="project-task-assignee"
      title={`${member.name} · ${member.role}`}
    >
      {member.initials}
    </span>
  )
}

interface TaskViewProps {
  tasks: Task[]
  members: Member[]
}

function createMemberMap(members: Member[]) {
  return new Map(members.map((member) => [member.id, member]))
}

function compareTaskDueDate(left: Task, right: Task) {
  if (!left.dueDate && !right.dueDate) return left.id.localeCompare(right.id)
  if (!left.dueDate) return 1
  if (!right.dueDate) return -1
  return left.dueDate.localeCompare(right.dueDate)
}
