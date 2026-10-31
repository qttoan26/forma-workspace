import {
  taskChecklistCollectionSchema,
  type TaskChecklistItem,
} from '@/entities/task/model/task-checklist'
import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

const storagePrefix = 'forma-workspace:task-checklist:v1'

export function loadTaskChecklist(
  projectId: string,
  taskId: string,
): TaskChecklistItem[] {
  if (!hasLocalStorage()) return []

  try {
    const raw = globalThis.localStorage.getItem(
      createStorageKey(projectId, taskId),
    )
    if (!raw) return []

    const result = taskChecklistCollectionSchema.safeParse(JSON.parse(raw))
    if (!result.success) return []

    const scopedItems = result.data.filter(
      (item) => item.projectId === projectId && item.taskId === taskId,
    )
    reportBrowserStorageSuccess('local-storage')
    return scopedItems
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    return []
  }
}

export function saveTaskChecklist(
  projectId: string,
  taskId: string,
  items: TaskChecklistItem[],
) {
  if (!hasLocalStorage()) {
    throw new Error('Local storage is unavailable')
  }

  const parsedItems = taskChecklistCollectionSchema.parse(items)
  if (
    !parsedItems.every(
      (item) => item.projectId === projectId && item.taskId === taskId,
    )
  ) {
    throw new Error('Task checklist does not match task scope')
  }

  try {
    globalThis.localStorage.setItem(
      createStorageKey(projectId, taskId),
      JSON.stringify(parsedItems),
    )
    reportBrowserStorageSuccess('local-storage')
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    throw error
  }
}

function createStorageKey(projectId: string, taskId: string) {
  return `${storagePrefix}:${projectId}:${taskId}`
}

function hasLocalStorage() {
  try {
    return 'localStorage' in globalThis && Boolean(globalThis.localStorage)
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    return false
  }
}
