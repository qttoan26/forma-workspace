import { useEffect, useState } from 'react'

import { getTaskApiBaseUrl } from '@/entities/task/lib/task-api'
import {
  hasMemoryProjectTaskSync,
  memoryProjectTaskSyncChangeEvent,
} from '@/entities/task/lib/task-memory-sync-queue'
import {
  resolveProjectTaskSyncWithServer,
  retryConfiguredProjectTaskSync,
} from '@/entities/task/lib/task-persistence'
import { loadSessionProjectTaskSync } from '@/entities/task/lib/task-session-sync-queue'
import {
  getProjectTaskLastSyncedAt,
  getProjectTaskSyncConflictRevision,
  getProjectTaskSyncFailedAt,
  isProjectTaskSyncPending,
  projectTaskSyncChangeEvent,
} from '@/entities/task/lib/task-sync-storage'

interface ProjectBoardSyncStatusProps {
  projectId: string
}

type RecoverySource = 'indexed-db' | 'session-storage' | 'memory' | null

interface SyncSnapshot {
  isOnline: boolean
  isPending: boolean
  lastSyncedAt: string | null
  failedAt: string | null
  conflictRevision: number | null | undefined
  recoverySource: RecoverySource
}

export function ProjectBoardSyncStatus({
  projectId,
}: ProjectBoardSyncStatusProps) {
  const [snapshot, setSnapshot] = useState(() => readSyncSnapshot(projectId))
  const [isRetrying, setIsRetrying] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const hasRemoteSync = Boolean(getTaskApiBaseUrl())

  useEffect(() => {
    function updateSnapshot() {
      setSnapshot(readSyncSnapshot(projectId))
    }

    function handleProjectChange(event: Event) {
      const customEvent = event as CustomEvent<{ projectId?: string }>
      if (customEvent.detail?.projectId === projectId) updateSnapshot()
    }

    updateSnapshot()
    window.addEventListener('online', updateSnapshot)
    window.addEventListener('offline', updateSnapshot)
    window.addEventListener('storage', updateSnapshot)
    window.addEventListener(projectTaskSyncChangeEvent, handleProjectChange)
    window.addEventListener(
      memoryProjectTaskSyncChangeEvent,
      handleProjectChange,
    )

    return () => {
      window.removeEventListener('online', updateSnapshot)
      window.removeEventListener('offline', updateSnapshot)
      window.removeEventListener('storage', updateSnapshot)
      window.removeEventListener(
        projectTaskSyncChangeEvent,
        handleProjectChange,
      )
      window.removeEventListener(
        memoryProjectTaskSyncChangeEvent,
        handleProjectChange,
      )
    }
  }, [projectId])

  const status = getSyncStatus(hasRemoteSync, snapshot)
  const hasConflict = snapshot.conflictRevision !== undefined
  const canResolveConflict =
    hasRemoteSync && snapshot.isOnline && snapshot.isPending && hasConflict
  const canRetry =
    hasRemoteSync &&
    snapshot.isOnline &&
    snapshot.isPending &&
    Boolean(snapshot.failedAt) &&
    !hasConflict

  async function retrySync() {
    if (!canRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await retryConfiguredProjectTaskSync(projectId)
    } finally {
      setIsRetrying(false)
    }
  }

  async function useServerVersion() {
    if (!canResolveConflict || isResolving) return

    setIsResolving(true)
    try {
      await resolveProjectTaskSyncWithServer(projectId)
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div
      className={`project-sync-status project-sync-status-${status.tone}`}
      role="status"
      title={status.title}
    >
      <span className="project-sync-status-dot" aria-hidden="true" />
      <span>{status.label}</span>
      {canResolveConflict ? (
        <button
          className="project-sync-status-action"
          type="button"
          disabled={isResolving}
          onClick={() => void useServerVersion()}
        >
          {isResolving ? 'Loading…' : 'Use server'}
        </button>
      ) : null}
      {canRetry ? (
        <button
          className="project-sync-status-action"
          type="button"
          disabled={isRetrying}
          onClick={() => void retrySync()}
        >
          {isRetrying ? 'Retrying…' : 'Retry'}
        </button>
      ) : null}
    </div>
  )
}

function readSyncSnapshot(projectId: string): SyncSnapshot {
  const isPending = isProjectTaskSyncPending(projectId)

  return {
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    isPending,
    lastSyncedAt: getProjectTaskLastSyncedAt(projectId),
    failedAt: getProjectTaskSyncFailedAt(projectId),
    conflictRevision: getProjectTaskSyncConflictRevision(projectId),
    recoverySource: isPending ? readRecoverySource(projectId) : null,
  }
}

function readRecoverySource(projectId: string): RecoverySource {
  if (hasMemoryProjectTaskSync(projectId)) return 'memory'
  if (loadSessionProjectTaskSync(projectId)) return 'session-storage'
  return 'indexed-db'
}

function getSyncStatus(hasRemoteSync: boolean, snapshot: SyncSnapshot) {
  if (!hasRemoteSync) {
    return {
      label: 'Saved locally',
      title: 'Tasks are stored in this browser.',
      tone: 'local',
    } as const
  }

  if (
    snapshot.isOnline &&
    snapshot.isPending &&
    snapshot.conflictRevision !== undefined
  ) {
    const revisionDetail =
      snapshot.conflictRevision === null
        ? ''
        : ` Server revision ${snapshot.conflictRevision} is newer.`
    return {
      label: 'Sync conflict',
      title: `Your local changes were based on an older server version.${revisionDetail} Use the server version to resolve without overwriting newer remote changes.`,
      tone: 'failed',
    } as const
  }

  if (snapshot.isOnline && snapshot.isPending && snapshot.failedAt) {
    return {
      label: 'Sync failed',
      title: `Latest sync attempt failed ${new Date(snapshot.failedAt).toLocaleString()}. Changes remain saved locally and will be retried.`,
      tone: 'failed',
    } as const
  }

  if (snapshot.isPending && snapshot.recoverySource === 'memory') {
    return {
      label: 'Memory only',
      title:
        'Changes are waiting to sync and currently exist only in this open tab. Keep this tab open until sync completes.',
      tone: 'recovery',
    } as const
  }

  if (snapshot.isPending && snapshot.recoverySource === 'session-storage') {
    return {
      label: snapshot.isOnline
        ? 'Recovered · waiting to sync'
        : 'Offline · saved for this tab',
      title: snapshot.isOnline
        ? 'Unsynced changes were recovered from this tab and are waiting to sync.'
        : 'Unsynced changes are saved for this tab and will retry when connection returns.',
      tone: 'recovery',
    } as const
  }

  if (snapshot.isPending) {
    return {
      label: snapshot.isOnline ? 'Waiting to sync' : 'Offline · saved locally',
      title: snapshot.isOnline
        ? 'Local changes are safely stored and waiting to sync.'
        : 'Changes are safely stored in this browser and will sync when connection returns.',
      tone: snapshot.isOnline ? 'pending' : 'offline',
    } as const
  }

  if (!snapshot.isOnline) {
    return {
      label: 'Offline',
      title: 'No unsynced task changes are waiting in this tab.',
      tone: 'offline',
    } as const
  }

  if (snapshot.lastSyncedAt) {
    return {
      label: 'Synced',
      title: `Last synced ${new Date(snapshot.lastSyncedAt).toLocaleString()}`,
      tone: 'synced',
    } as const
  }

  return {
    label: 'Ready to sync',
    title: 'Remote sync is configured.',
    tone: 'ready',
  } as const
}
