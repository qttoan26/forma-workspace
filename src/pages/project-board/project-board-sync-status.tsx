import { useEffect, useState } from 'react'

import { getTaskApiBaseUrl } from '@/entities/task/lib/task-api'
import {
  getProjectTaskLastSyncedAt,
  isProjectTaskSyncPending,
  projectTaskSyncChangeEvent,
} from '@/entities/task/lib/task-sync-storage'

interface ProjectBoardSyncStatusProps {
  projectId: string
}

interface SyncSnapshot {
  isOnline: boolean
  isPending: boolean
  lastSyncedAt: string | null
}

export function ProjectBoardSyncStatus({
  projectId,
}: ProjectBoardSyncStatusProps) {
  const [snapshot, setSnapshot] = useState(() => readSyncSnapshot(projectId))
  const hasRemoteSync = Boolean(getTaskApiBaseUrl())

  useEffect(() => {
    function updateSnapshot() {
      setSnapshot(readSyncSnapshot(projectId))
    }

    function handleSyncChange(event: Event) {
      const customEvent = event as CustomEvent<{ projectId?: string }>
      if (customEvent.detail?.projectId === projectId) updateSnapshot()
    }

    updateSnapshot()
    window.addEventListener('online', updateSnapshot)
    window.addEventListener('offline', updateSnapshot)
    window.addEventListener('storage', updateSnapshot)
    window.addEventListener(projectTaskSyncChangeEvent, handleSyncChange)

    return () => {
      window.removeEventListener('online', updateSnapshot)
      window.removeEventListener('offline', updateSnapshot)
      window.removeEventListener('storage', updateSnapshot)
      window.removeEventListener(projectTaskSyncChangeEvent, handleSyncChange)
    }
  }, [projectId])

  const status = getSyncStatus(hasRemoteSync, snapshot)

  return (
    <div
      className={`project-sync-status project-sync-status-${status.tone}`}
      role="status"
      title={status.title}
    >
      <span className="project-sync-status-dot" aria-hidden="true" />
      <span>{status.label}</span>
    </div>
  )
}

function readSyncSnapshot(projectId: string): SyncSnapshot {
  return {
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    isPending: isProjectTaskSyncPending(projectId),
    lastSyncedAt: getProjectTaskLastSyncedAt(projectId),
  }
}

function getSyncStatus(hasRemoteSync: boolean, snapshot: SyncSnapshot) {
  if (!hasRemoteSync) {
    return {
      label: 'Saved locally',
      title: 'Tasks are stored in this browser.',
      tone: 'local',
    } as const
  }

  if (!snapshot.isOnline) {
    return {
      label: 'Offline · saved locally',
      title: 'Changes stay in this browser and will sync when connection returns.',
      tone: 'offline',
    } as const
  }

  if (snapshot.isPending) {
    return {
      label: 'Pending sync',
      title: 'Local changes are waiting to sync.',
      tone: 'pending',
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
