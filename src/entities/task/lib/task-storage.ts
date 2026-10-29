import { taskCollectionSchema, type Task } from '@/entities/task/model/task'

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
    const result = taskCollectionSchema.safeParse(parsed)
    if (!result.success) return fallback
    if (!result.data.every((task) => task.projectId === projectId)) {
      return fallback
    }

    return result.data
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

export function clearProjectTasks(
  projectId: string,
  storage: Storage = window.localStorage,
) {
  try {
    storage.removeItem(storageKey(projectId))
  } catch {
    // Legacy cleanup is best-effort.
  }
}

function storageKey(projectId: string) {
  return `forma:tasks:${storageVersion}:${projectId}`
}
