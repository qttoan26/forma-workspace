import { lazy, Suspense, useId, useState } from 'react'
import { localDateKey } from '@/shared/lib/local-date-key'

import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import {
  isTaskOverdue,
  taskPriorities,
  taskStatuses,
  taskStatusLabels,
} from '@/entities/task/model/task'
import {
  defaultWorkTaskSearch,
  filterWorkTasks,
  workTaskScopes,
  type WorkTaskSearch,
} from './work-task-filters'

const TaskTable = lazy(() =>
  import('@/widgets/task-table/task-table').then((module) => ({
    default: module.TaskTable,
  })),
)
const projectHref = `${import.meta.env.BASE_URL}workspaces/forma/projects/project-1`
const scopeLabels = {
  all: 'All tasks',
  open: 'Open',
  overdue: 'Overdue',
  completed: 'Completed',
}

export interface WorkTaskExplorerProps {
  search: WorkTaskSearch
  onSearchChange: (search: WorkTaskSearch) => void
}

export function WorkTaskExplorer({
  data,
  userId,
  personal = false,
  search,
  onSearchChange,
}: WorkTaskExplorerProps & {
  data: ProjectBoardData
  userId: string | undefined
  personal?: boolean
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterOptionsId = useId()
  const tasks = personal
    ? data.initialTasks.filter((task) => task.assigneeId === userId)
    : data.initialTasks
  const effectiveSearch = personal ? { ...search, assignee: 'all' } : search
  const visibleTasks = filterWorkTasks(tasks, data.members, effectiveSearch)
  const today = localDateKey()
  const counts = {
    all: tasks.length,
    open: tasks.filter((task) => task.status !== 'done').length,
    overdue: tasks.filter((task) => isTaskOverdue(task, today)).length,
    completed: tasks.filter((task) => task.status === 'done').length,
  }
  const advancedFilterCount = (
    ['status', 'priority', 'assignee', 'due'] as const
  ).filter((key) => effectiveSearch[key] !== defaultWorkTaskSearch[key]).length
  const hasFilters = Object.entries(effectiveSearch).some(
    ([key, value]) =>
      value !== defaultWorkTaskSearch[key as keyof WorkTaskSearch],
  )
  function update(patch: Partial<WorkTaskSearch>) {
    onSearchChange({ ...search, ...patch })
  }
  return (
    <section
      className="work-panel work-task-explorer"
      aria-label={personal ? 'Personal task explorer' : 'Task explorer'}
    >
      <div className="work-panel-heading">
        <div>
          <h2>{personal ? 'Your task list' : 'Project task list'}</h2>
          <p className="work-heading-meta">{data.project.name}</p>
        </div>
        <a className="module-primary-action" href={`${projectHref}?newTask=1`}>
          New task
        </a>
      </div>
      <div className="work-task-scopes" role="group" aria-label="Task scope">
        {workTaskScopes.map((scope) => (
          <button
            type="button"
            key={scope}
            aria-pressed={search.scope === scope}
            onClick={() => update({ scope })}
          >
            {scopeLabels[scope]} <span>{counts[scope]}</span>
          </button>
        ))}
      </div>
      <form
        className="work-task-filters"
        aria-label="Filter work tasks"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="work-task-search">
          Search tasks
          <input
            type="search"
            placeholder="Title, ID or assignee"
            value={search.query}
            onChange={(event) => update({ query: event.target.value })}
          />
        </label>
        <button
          type="button"
          className="button-secondary work-task-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls={filterOptionsId}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters{advancedFilterCount ? ` (${advancedFilterCount})` : ''}
        </button>
        <div
          id={filterOptionsId}
          className="work-task-filter-options"
          data-expanded={filtersOpen}
        >
          <label>
            Status
            <select
              value={search.status}
              onChange={(event) =>
                update({
                  status: event.target.value as WorkTaskSearch['status'],
                })
              }
            >
              <option value="all">All statuses</option>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={search.priority}
              onChange={(event) =>
                update({
                  priority: event.target.value as WorkTaskSearch['priority'],
                })
              }
            >
              <option value="all">All priorities</option>
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          {!personal ? (
            <label>
              Assignee
              <select
                value={search.assignee}
                onChange={(event) => update({ assignee: event.target.value })}
              >
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
                {![
                  'all',
                  'unassigned',
                  ...data.members.map((member) => member.id),
                ].includes(search.assignee) ? (
                  <option value={search.assignee}>Unavailable member</option>
                ) : null}
              </select>
            </label>
          ) : null}
          <label>
            Due date
            <select
              value={search.due}
              onChange={(event) =>
                update({ due: event.target.value as WorkTaskSearch['due'] })
              }
            >
              <option value="all">Any date</option>
              <option value="today">Today</option>
              <option value="week">Next 7 days</option>
              <option value="none">No due date</option>
            </select>
          </label>
        </div>
      </form>
      <div className="work-task-results">
        <p role="status" aria-live="polite">
          Showing {visibleTasks.length} of {tasks.length} tasks
        </p>
        {hasFilters ? (
          <button
            type="button"
            className="button-secondary"
            onClick={() => onSearchChange(defaultWorkTaskSearch)}
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <Suspense fallback={<p role="status">Loading task table…</p>}>
        <TaskTable
          tasks={visibleTasks}
          members={data.members}
          getTaskHref={(taskId) =>
            `${projectHref}?task=${encodeURIComponent(taskId)}`
          }
          emptyMessage={
            hasFilters
              ? 'No matching tasks. Clear filters to see all tasks.'
              : personal
                ? 'No tasks assigned to you yet.'
                : 'No tasks yet. Create a task to get started.'
          }
        />
      </Suspense>
    </section>
  )
}
