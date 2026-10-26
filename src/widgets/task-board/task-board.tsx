import { useMemo, useState } from 'react'

import type { Member } from '@/entities/member/model/member'
import {
  taskStatusLabels,
  taskStatuses,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task/model/task'
import type { TaskFormValues } from '@/features/task-form/model/task-form-schema'
import { TaskForm } from '@/features/task-form/ui/task-form'

interface TaskBoardFilters {
  priority?: TaskPriority
  assigneeId?: string
  query?: string
}

interface TaskBoardProps {
  initialTasks: Task[]
  members: Member[]
  filters?: TaskBoardFilters
}

export function TaskBoard({ initialTasks, members, filters }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )
  const normalizedQuery = filters?.query?.trim().toLocaleLowerCase()
  const visibleTasks = tasks.filter(
    (task) =>
      (!filters?.priority || task.priority === filters.priority) &&
      (!filters?.assigneeId || task.assigneeId === filters.assigneeId) &&
      (!normalizedQuery ||
        task.title.toLocaleLowerCase().includes(normalizedQuery) ||
        task.id.toLocaleLowerCase().includes(normalizedQuery)),
  )
  const editingTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId)
    : undefined

  function moveTask(taskId: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    )
  }

  function createTask(values: TaskFormValues) {
    setTasks((current) => [
      ...current,
      {
        id: nextTaskId(current),
        projectId: initialTasks[0]?.projectId ?? 'project-1',
        title: values.title,
        status: values.status,
        priority: values.priority,
        ...(values.assigneeId ? { assigneeId: values.assigneeId } : {}),
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
      },
    ])
    setIsCreating(false)
  }

  function updateTask(values: TaskFormValues) {
    if (!editingTaskId) return

    setTasks((current) =>
      current.map((task) => {
        if (task.id !== editingTaskId) return task

        const updated: Task = {
          id: task.id,
          projectId: task.projectId,
          title: values.title,
          status: values.status,
          priority: values.priority,
          ...(task.description ? { description: task.description } : {}),
          ...(values.assigneeId ? { assigneeId: values.assigneeId } : {}),
          ...(values.dueDate ? { dueDate: values.dueDate } : {}),
        }

        return updated
      }),
    )
    setEditingTaskId(null)
  }

  return (
    <section aria-label="Project task board">
      <div className="board-toolbar">
        <button
          className="button-primary"
          type="button"
          onClick={() => {
            setEditingTaskId(null)
            setIsCreating(true)
          }}
        >
          New task
        </button>
      </div>

      {isCreating ? (
        <TaskForm
          members={members}
          onCancel={() => setIsCreating(false)}
          onSubmit={createTask}
        />
      ) : null}

      {editingTask ? (
        <TaskForm
          members={members}
          task={editingTask}
          onCancel={() => setEditingTaskId(null)}
          onSubmit={updateTask}
        />
      ) : null}

      <p aria-live="polite" role="status">
        {visibleTasks.length} of {tasks.length} tasks shown
      </p>
      {visibleTasks.length === 0 && tasks.length > 0 ? (
        <p role="note">
          Try clearing filters or using a different search term.
        </p>
      ) : null}
      <div className="board">
        {taskStatuses.map((status) => {
          const columnTasks = visibleTasks.filter(
            (task) => task.status === status,
          )
          return (
            <section
              className="board-column"
              key={status}
              aria-labelledby={`column-${status}`}
            >
              <header className="column-header">
                <h2 id={`column-${status}`}>{taskStatusLabels[status]}</h2>
                <span aria-label={`${columnTasks.length} tasks`}>
                  {columnTasks.length}
                </span>
              </header>
              <div className="task-list">
                {columnTasks.length === 0 ? (
                  <p className="board-empty-state">No matching tasks</p>
                ) : null}
                {columnTasks.map((task) => {
                  const assignee = task.assigneeId
                    ? membersById.get(task.assigneeId)
                    : undefined
                  return (
                    <article className="task-card" key={task.id}>
                      <div className="task-meta">
                        <span>{task.id}</span>
                        <span className={`priority priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h3>{task.title}</h3>
                      <div className="task-footer">
                        <span title={assignee?.name}>
                          {assignee?.initials ?? '—'}
                        </span>
                        {task.dueDate ? (
                          <time dateTime={task.dueDate}>{task.dueDate}</time>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>
                      <div className="task-actions">
                        <label className="move-task">
                          <span>Move to</span>
                          <select
                            aria-label={`Move ${task.title}`}
                            value={task.status}
                            onChange={(event) =>
                              moveTask(
                                task.id,
                                event.target.value as TaskStatus,
                              )
                            }
                          >
                            {taskStatuses.map((option) => (
                              <option key={option} value={option}>
                                {taskStatusLabels[option]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => {
                            setIsCreating(false)
                            setEditingTaskId(task.id)
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

function nextTaskId(tasks: Task[]) {
  const largest = tasks.reduce((max, task) => {
    const value = Number(task.id.split('-').at(-1))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)

  return `FOR-${String(largest + 1).padStart(2, '0')}`
}
