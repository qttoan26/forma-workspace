import { useEffect, useState } from 'react'

import {
  hasMemoryProjectTaskSync,
  memoryProjectTaskSyncChangeEvent,
} from '@/entities/task/lib/task-memory-sync-queue'

interface ProjectBoardMemoryRecoveryProps {
  projectId: string
}

export function ProjectBoardMemoryRecovery({
  projectId,
}: ProjectBoardMemoryRecoveryProps) {
  const [hasMemoryRecovery, setHasMemoryRecovery] = useState(() =>
    hasMemoryProjectTaskSync(projectId),
  )

  useEffect(() => {
    function updateMemoryRecovery(event: Event) {
      const customEvent = event as CustomEvent<{ projectId?: string }>
      if (customEvent.detail?.projectId !== projectId) return
      setHasMemoryRecovery(hasMemoryProjectTaskSync(projectId))
    }

    window.addEventListener(
      memoryProjectTaskSyncChangeEvent,
      updateMemoryRecovery,
    )
    return () =>
      window.removeEventListener(
        memoryProjectTaskSyncChangeEvent,
        updateMemoryRecovery,
      )
  }, [projectId])

  useEffect(() => {
    if (!hasMemoryRecovery) return

    function preventUnsafeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = true
    }

    window.addEventListener('beforeunload', preventUnsafeUnload)
    return () => window.removeEventListener('beforeunload', preventUnsafeUnload)
  }, [hasMemoryRecovery])

  if (!hasMemoryRecovery) return null

  return (
    <div className="persistence-alert" role="alert" aria-live="assertive">
      <div>
        <strong>Unsynced changes are only protected in this open tab.</strong>
        <p>
          Keep this tab open until syncing recovers. Reloading or closing it may
          lose the latest task changes.
        </p>
      </div>
    </div>
  )
}
