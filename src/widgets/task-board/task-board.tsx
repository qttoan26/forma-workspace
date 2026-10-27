import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import type { Member } from '@/entities/member/model/member'
import { inferTaskIdPrefix, nextTaskId } from '@/entities/task/lib/task-id'
import {
  loadProjectTasks,
  saveProjectTasks,
} from '@/entities/task/lib/task-storage'
import {
  taskStatusLabels,
  taskStatuses,
  type Task,
  type TaskStatus,
} from '@/entities/task/model/task'
import type { TaskFormValues } from '@/features/task-form/model/task-form-schema'
import { TaskForm } from '@/features/task-form/ui/task-form'
import { Button } from '@/shared/ui'

import {
  filterTasks,
  groupTasksByStatus,
  type TaskBoardFilters,
  updateTaskStatus,
} from './model/task-board-view'
import './task-board.css'

const VIRTUALIZATION_THRESHOLD = 100
const ESTIMATED_TASK_HEIGHT = 228
const VIRTUAL_OVERSCAN = 6

interface TaskBoardPersistence {
  load: (projectId: string, fallback: Task[]) => Task[]
  save: (projectId: string, tasks: Task[]) => void
}

interface DeletedTaskSnapshot {
  task: Task
  index: number
}

const defaultPersistence: TaskBoardPersistence = {
  load: loadProjectTasks,
  save: saveProjectTasks,
}

interface TaskBoardProps {
  projectId?: string
  taskIdPrefix?: string
  initialTasks: Task[]
  members: Member[]
  filters?: TaskBoardFilters
  selectedTaskId?: string | null
  onSelectedTaskChange?: (taskId: string | null) => void
  isCreatingTask?: boolean
  onCreatingTaskChange?: (isCreating: boolean) => void
  persistence?: TaskBoardPersistence | null
}

export function TaskBoard({
  projectId: explicitProjectId,
  taskIdPrefix: explicitTaskIdPrefix,
  initialTasks,
  members,
  filters,
  selectedTaskId,
  onSelectedTaskChange,
  isCreatingTask,
  onCreatingTaskChange,
  persistence = defaultPersistence,
}: TaskBoardProps) {
  const projectId = explicitProjectId ?? initialTasks[0]?.projectId
  if (!projectId) {
    throw new Error('TaskBoard requires a projectId when initialTasks is empty')
  }
  const scopedProjectId = projectId
  const taskIdPrefix =
    explicitTaskIdPrefix ?? inferTaskIdPrefix(initialTasks) ?? 'TASK'

  const [tasks, setTasks] = useState(() =>
    persistence ? persistence.load(projectId, initialTasks) : initialTasks,
  )

  useEffect(() => {
    persistence?.save(projectId, tasks)
  }, [persistence, projectId, tasks])
  const [internalEditingTaskId, setInternalEditingTaskId] = useState<
    string | null
  >(null)
  const editingTaskId =
    selectedTaskId === undefined ? internalEditingTaskId : selectedTaskId
  const [internalIsCreating, setInternalIsCreating] = useState(false)
  const isCreating =
    isCreatingTask === undefined ? internalIsCreating : isCreatingTask
  const [deletedTask, setDeletedTask] = useState<DeletedTaskSnapshot | null>(
    null,
  )
  const editorTriggerRef = useRef<HTMLElement | null>(null)
  const wasEditorOpenRef = useRef(false)
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )
  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters),
    [filters, tasks],
  )
  const columns = useMemo(
    () => groupTasksByStatus(visibleTasks),
    [visibleTasks],
  )
  const editingTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId)
    : undefined
  const missingSelectedTaskId =
    selectedTaskId && !editingTask ? selectedTaskId : null
  const isEditorOpen = isCreating || Boolean(editingTask)

  useEffect(() => {
    if (wasEditorOpenRef.current && !isEditorOpen) {
      const trigger = editorTriggerRef.current
      if (trigger?.isConnected) trigger.focus()
      editorTriggerRef.current = null
    }

    wasEditorOpenRef.current = isEditorOpen
  }, [isEditorOpen])

  function setEditingTask(taskId: string | null) {
    if (selectedTaskId === undefined) setInternalEditingTaskId(taskId)
    onSelectedTaskChange?.(taskId)
  }

  function setCreatingTask(isCreatingValue: boolean) {
    if (isCreatingTask === undefined) setInternalIsCreating(isCreatingValue)
    onCreatingTaskChange?.(isCreatingValue)
  }

  function rememberEditorTrigger() {
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement
    ) {
      editorTriggerRef.current = document.activeElement
    }
  }

  function moveTask(taskId: string, status: TaskStatus) {
    setTasks((current) => updateTaskStatus(current, taskId, status))
  }

  function editTask(taskId: string) {
    rememberEditorTrigger()
    setCreatingTask(false)
    setEditingTask(taskId)
  }

  function createTask(values: TaskFormValues) {
    setTasks((current) => [
      ...current,
      {
        id: nextTaskId(current, taskIdPrefix),
        projectId: scopedProjectId,
        title: values.title,
        status: values.status,
        priority: values.priority,
        ...(values.description ? { description: values.description } : {}),
        ...(values.assigneeId ? { assigneeId: values.assigneeId } : {}),
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
      },
    ])
    setDeletedTask(null)
    setCreatingTask(false)
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
          ...(values.description ? { description: values.description } : {}),
          ...(values.assigneeId ? { assigneeId: values.assigneeId } : {}),
          ...(values.dueDate ? { dueDate: values.dueDate } : {}),
        }

        return updated
      }),
    )
    setEditingTask(null)
  }

  function deleteTask(task: Task) {
    const confirmed = window.confirm(`Delete \"${task.title}\"?`)
    if (!confirmed) return

    const index = tasks.findIndex((item) => item.id === task.id)
    if (index === -1) return

    setDeletedTask({ task, index })
    setTasks((current) => current.filter((item) => item.id !== task.id))
    if (editingTaskId === task.id) setEditingTask(null)
  }

  function undoDelete() {
    if (!deletedTask) return

    setTasks((current) => {
      if (current.some((task) => task.id === deletedTask.task.id)) {
        return current
      }

      const index = Math.min(deletedTask.index, current.length)
      return [
        ...current.slice(0, index),
        deletedTask.task,
        ...current.slice(index),
      ]
    })
    setDeletedTask(null)
  }

  return (
    <section aria-label="Project task board">
      <div className="board-toolbar">
        <Button
          variant="primary"
          type="button"
          aria-keyshortcuts="N"
          title="Press N to create a task"
          onClick={() => {
            rememberEditorTrigger()
            setEditingTask(null)
            setCreatingTask(true)
          }}
        >
          New task
        </Button>
      </div>

      {isCreating ? (
        <TaskForm
          members={members}
          onCancel={() => setCreatingTask(false)}
          onSubmit={createTask}
        />
      ) : null}

      {editingTask ? (
        <TaskForm
          members={members}
          task={editingTask}
          onCancel={() => setEditingTask(null)}
          onSubmit={updateTask}
        />
      ) : null}

      {missingSelectedTaskId ? (
        <div role="alert">
          <p>Task {missingSelectedTaskId} could not be found.</p>
          <Button type="button" onClick={() => setEditingTask(null)}>
            Return to board
          </Button>
        </div>
      ) : null}

      {deletedTask ? (
        <div className="task-delete-undo" aria-live="polite">
          <span>Deleted {deletedTask.task.title}.</span>
          <Button type="button" autoFocus onClick={undoDelete}>
            Undo
          </Button>
        </div>
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
        {taskStatuses.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={columns[status]}
            membersById={membersById}
            onMove={moveTask}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        ))}
      </div>
    </section>
  )
}

interface TaskColumnProps {
  status: TaskStatus
  tasks: Task[]
  membersById: Map<string, Member>
  onMove: (taskId: string, status: TaskStatus) => void
  onEdit: (taskId: string) => void
  onDelete: (task: Task) => void
}

function TaskColumn({
  status,
  tasks,
  membersById,
  onMove,
  onEdit,
  onDelete,
}: TaskColumnProps) {
  const shouldVirtualize = tasks.length > VIRTUALIZATION_THRESHOLD

  return (
    <section
      className="board-column"
      aria-labelledby={`column-${status}`}
      data-virtualized={shouldVirtualize ? 'true' : 'false'}
    >
      <header className="column-header">
        <h2 id={`column-${status}`}>{taskStatusLabels[status]}</h2>
        <span aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <div className="task-list">
          <p className="board-empty-state">No matching tasks</p>
        </div>
      ) : shouldVirtualize ? (
        <VirtualTaskList
          tasks={tasks}
          status={status}
          membersById={membersById}
          onMove={onMove}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <div
          className="task-list"
          role="list"
          aria-label={`${taskStatusLabels[status]} tasks`}
        >
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              membersById={membersById}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
              position={index + 1}
              setSize={tasks.length}
            />
          ))}
        </div>
      )}
    </section>
  )
}

interface VirtualTaskListProps {
  tasks: Task[]
  status: TaskStatus
  membersById: Map<string, Member>
  onMove: (taskId: string, status: TaskStatus) => void
  onEdit: (taskId: string) => void
  onDelete: (task: Task) => void
}

function VirtualTaskList({
  tasks,
  status,
  membersById,
  onMove,
  onEdit,
  onDelete,
}: VirtualTaskListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_TASK_HEIGHT,
    getItemKey: (index) => tasks[index]?.id ?? index,
    overscan: VIRTUAL_OVERSCAN,
    useFlushSync: false,
  })
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={scrollRef}
      className="task-list task-list-virtualized"
      role="list"
      aria-label={`${taskStatusLabels[status]} tasks`}
      tabIndex={0}
    >
      <div
        className="task-virtual-space"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const task = tasks[virtualItem.index]
          if (!task) return null

          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              className="task-virtual-row"
              data-index={virtualItem.index}
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              <TaskCard
                task={task}
                membersById={membersById}
                onMove={onMove}
                onEdit={onEdit}
                onDelete={onDelete}
                position={virtualItem.index + 1}
                setSize={tasks.length}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: Task
  membersById: Map<string, Member>
  onMove: (taskId: string, status: TaskStatus) => void
  onEdit: (taskId: string) => void
  onDelete: (task: Task) => void
  position: number
  setSize: number
}

function TaskCard({
  task,
  membersById,
  onMove,
  onEdit,
  onDelete,
  position,
  setSize,
}: TaskCardProps) {
  const assignee = task.assigneeId
    ? membersById.get(task.assigneeId)
    : undefined

  return (
    <article
      className="task-card"
      role="listitem"
      aria-posinset={position}
      aria-setsize={setSize}
    >
      <div className="task-meta">
        <span>{task.id}</span>
        <span
          className={`priority priority-${task.priority}`}
          aria-label={`Priority: ${task.priority}`}
        >
          {task.priority}
        </span>
      </div>
      <h3>{task.title}</h3>
      {task.description ? (
        <p className="task-description">{task.description}</p>
      ) : null}
      <div className="task-footer">
        <span
          title={assignee?.name}
          aria-label={assignee ? `Assignee: ${assignee.name}` : 'Unassigned'}
        >
          {assignee?.initials ?? '—'}
        </span>
        {task.dueDate ? (
          <time
            dateTime={task.dueDate}
            aria-label={`Due date: ${task.dueDate}`}
          >
            {task.dueDate}
          </time>
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
              onMove(task.id, event.target.value as TaskStatus)
            }
          >
            {taskStatuses.map((option) => (
              <option key={option} value={option}>
                {taskStatusLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task.id)}
        >
          Edit
        </Button>
        <Button
          type="button"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          Delete
        </Button>
      </div>
    </article>
  )
}
