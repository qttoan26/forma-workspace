import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import { getFrontendAuthStorageScope } from '@/shared/lib/auth-session'

const storageVersion = 'v2'
const legacyStorageVersion = 'v1'
const localDevelopmentStorageScope = 'local-development-user'

export function loadProjectTasks(
  projectId: string,
  fallback: Task[],
  storage: Storage = window.localStorage,
): Task[] {
  try {
    const scopedKey = storageKey(projectId)
    const saved = storage.getItem(scopedKey)
    if (saved) return parseStoredTasks(projectId, saved, fallback)

    if (getFrontendAuthStorageScope() !== localDevelopmentStorageScope) {
      return fallback
    }

    const legacyKey = legacyStorageKey(projectId)
    const legacy = storage.getItem(legacyKey)
    if (!legacy) return fallback

    const tasks = parseStoredTasks(projectId, legacy, fallback)
    if (tasks === fallback) return fallback

    storage.setItem(scopedKey, JSON.stringify(tasks))
    storage.removeItem(legacyKey)
    return tasks
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
    if (getFrontendAuthStorageScope() === localDevelopmentStorageScope) {
      storage.removeItem(legacyStorageKey(projectId))
    }
  } catch {
    // Legacy cleanup is best-effort.
  }
}

function parseStoredTasks(projectId: string, saved: string, fallback: Task[]) {
  const parsed: unknown = JSON.parse(saved)
  const result = taskCollectionSchema.safeParse(parsed)
  if (!result.success) return fallback
  if (!result.data.every((task) => task.projectId === projectId)) {
    return fallback
  }

  return result.data
}

function storageKey(projectId: string) {
  return `forma:tasks:${storageVersion}:${getFrontendAuthStorageScope()}:${projectId}`
}

function legacyStorageKey(projectId: string) {
  return `forma:tasks:${legacyStorageVersion}:${projectId}`
}
