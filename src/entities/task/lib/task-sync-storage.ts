import {
  resolveBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/shared/lib/browser-storage-health'

const syncVersion = 'v1'
export const projectTaskSyncChangeEvent = 'forma:project-task-sync-change'

export function markProjectTaskSyncPending(projectId: string) {
  safeStorageSetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    pendingKey(projectId),
    '1',
  )
  notifyProjectTaskSyncChange(projectId)
}

export function clearProjectTaskSyncPending(projectId: string) {
  safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    pendingKey(projectId),
  )
  notifyProjectTaskSyncChange(projectId)
}

export function isProjectTaskSyncPending(projectId: string) {
  return (
    safeStorageGetItem(
      'session-storage',
      resolveBrowserStorage('session-storage'),
      pendingKey(projectId),
    ) === '1'
  )
}

export function recordProjectTaskSyncSuccess(projectId: string) {
  safeStorageSetItem(
    'local-storage',
    resolveBrowserStorage('local-storage'),
    lastSyncedKey(projectId),
    new Date().toISOString(),
  )
  safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    pendingKey(projectId),
  )
  notifyProjectTaskSyncChange(projectId)
}

export function getProjectTaskLastSyncedAt(projectId: string) {
  return safeStorageGetItem(
    'local-storage',
    resolveBrowserStorage('local-storage'),
    lastSyncedKey(projectId),
  )
}

function notifyProjectTaskSyncChange(projectId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(projectTaskSyncChangeEvent, { detail: { projectId } }),
  )
}

function pendingKey(projectId: string) {
  return `forma:task-sync:${syncVersion}:pending:${projectId}`
}

function lastSyncedKey(projectId: string) {
  return `forma:task-sync:${syncVersion}:last-synced:${projectId}`
}
