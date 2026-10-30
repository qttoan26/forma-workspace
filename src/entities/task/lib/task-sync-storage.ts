import { getFrontendAuthStorageScope } from '@/shared/lib/auth-session'
import {
  resolveBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/shared/lib/browser-storage-health'

const syncVersion = 'v2'
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

export function recordProjectTaskSyncFailure(projectId: string) {
  safeStorageSetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    failureKey(projectId),
    new Date().toISOString(),
  )
  removeProjectTaskSyncConflict(projectId, false)
  notifyProjectTaskSyncChange(projectId)
}

export function getProjectTaskSyncFailedAt(projectId: string) {
  return safeStorageGetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    failureKey(projectId),
  )
}

export function recordProjectTaskSyncConflict(
  projectId: string,
  actualRevision: number | null,
) {
  safeStorageSetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    failureKey(projectId),
    new Date().toISOString(),
  )
  safeStorageSetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    conflictKey(projectId),
    actualRevision === null ? 'unknown' : String(actualRevision),
  )
  notifyProjectTaskSyncChange(projectId)
}

export function getProjectTaskSyncConflictRevision(
  projectId: string,
): number | null | undefined {
  const rawRevision = safeStorageGetItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    conflictKey(projectId),
  )
  if (rawRevision === null) return undefined
  if (rawRevision === 'unknown') return null

  const revision = Number(rawRevision)
  return Number.isInteger(revision) && revision >= 0 ? revision : null
}

export function clearProjectTaskSyncConflict(projectId: string) {
  removeProjectTaskSyncConflict(projectId, true)
}

export function recordProjectTaskSyncSuccess(
  projectId: string,
  serverRevision?: number,
) {
  safeStorageSetItem(
    'local-storage',
    resolveBrowserStorage('local-storage'),
    lastSyncedKey(projectId),
    new Date().toISOString(),
  )
  if (serverRevision !== undefined) {
    recordProjectTaskServerRevision(projectId, serverRevision)
  }
  safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    pendingKey(projectId),
  )
  safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    failureKey(projectId),
  )
  removeProjectTaskSyncConflict(projectId, false)
  notifyProjectTaskSyncChange(projectId)
}

export function getProjectTaskLastSyncedAt(projectId: string) {
  return safeStorageGetItem(
    'local-storage',
    resolveBrowserStorage('local-storage'),
    lastSyncedKey(projectId),
  )
}

export function recordProjectTaskServerRevision(
  projectId: string,
  revision: number,
) {
  safeStorageSetItem(
    'local-storage',
    resolveBrowserStorage('local-storage'),
    serverRevisionKey(projectId),
    String(revision),
  )
}

export function getProjectTaskServerRevision(projectId: string): number | null {
  const rawRevision = safeStorageGetItem(
    'local-storage',
    resolveBrowserStorage('local-storage'),
    serverRevisionKey(projectId),
  )
  if (rawRevision === null) return null

  const revision = Number(rawRevision)
  return Number.isInteger(revision) && revision >= 0 ? revision : null
}

function removeProjectTaskSyncConflict(projectId: string, notify: boolean) {
  safeStorageRemoveItem(
    'session-storage',
    resolveBrowserStorage('session-storage'),
    conflictKey(projectId),
  )
  if (notify) notifyProjectTaskSyncChange(projectId)
}

function notifyProjectTaskSyncChange(projectId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(projectTaskSyncChangeEvent, { detail: { projectId } }),
  )
}

function pendingKey(projectId: string) {
  return scopedKey('pending', projectId)
}

function failureKey(projectId: string) {
  return scopedKey('failed-at', projectId)
}

function conflictKey(projectId: string) {
  return scopedKey('conflict-revision', projectId)
}

function lastSyncedKey(projectId: string) {
  return scopedKey('last-synced', projectId)
}

function serverRevisionKey(projectId: string) {
  return scopedKey('server-revision', projectId)
}

function scopedKey(kind: string, projectId: string) {
  return `forma:task-sync:${syncVersion}:${kind}:${getFrontendAuthStorageScope()}:${projectId}`
}
