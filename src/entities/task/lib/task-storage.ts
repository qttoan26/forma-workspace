import {
  taskPriorities,
  taskStatuses,
  type Task,
} from '@/entities/task/model/task'

const storageVersion = 'v1'

export function loadProjectTasks(
  projectId: string,
  fallback: Task[],
  storage: Storage = window.localStorage,
): Task[] {
  try {
    const saved = storage.getItem(storageKey(projectId))
    if (!saved) return fallback

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return fallback
    if (!parsed.every(isTask)) return fallback
    if (!parsed.every((task) => task.projectId === projectId)) return fallback

    return parsed
  } catch {
    return fallback
  }
}

export function saveProjectTasks(
  projectId: string,
  tasks: Task[],
  storage: Storage = window.localStorage,
) {
  try {
    storage.setItem(storageKey(projectId), JSON.stringify(tasks))
  } catch {
    // Persistence is best-effort when browser storage is unavailable.
  }
}

function storageKey(projectId: string) {
  return `forma:tasks:${storageVersion}:${projectId}`
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Record<string, unknown>

  return (
    typeof task.id === 'string' &&
    typeof task.projectId === 'string' &&
    typeof task.title === 'string' &&
    taskStatuses.some((status) => status === task.status) &&
    taskPriorities.some((priority) => priority === task.priority) &&
    (task.assigneeId === undefined || typeof task.assigneeId === 'string') &&
    (task.dueDate === undefined || typeof task.dueDate === 'string') &&
    (task.description === undefined || typeof task.description === 'string')
  )
}
