const syncVersion = 'v1'

export function markProjectTaskSyncPending(projectId: string) {
  safeSessionStorage()?.setItem(pendingKey(projectId), '1')
}

export function clearProjectTaskSyncPending(projectId: string) {
  safeSessionStorage()?.removeItem(pendingKey(projectId))
}

export function isProjectTaskSyncPending(projectId: string) {
  return safeSessionStorage()?.getItem(pendingKey(projectId)) === '1'
}

export function recordProjectTaskSyncSuccess(projectId: string) {
  safeLocalStorage()?.setItem(
    lastSyncedKey(projectId),
    new Date().toISOString(),
  )
  clearProjectTaskSyncPending(projectId)
}

export function getProjectTaskLastSyncedAt(projectId: string) {
  return safeLocalStorage()?.getItem(lastSyncedKey(projectId)) ?? null
}

function safeLocalStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function safeSessionStorage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function pendingKey(projectId: string) {
  return `forma:task-sync:${syncVersion}:pending:${projectId}`
}

function lastSyncedKey(projectId: string) {
  return `forma:task-sync:${syncVersion}:last-synced:${projectId}`
}
