import { useEffect, useState } from 'react'
import { loadProjectActivityFromIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { subscribeTaskActivity } from '@/entities/task/lib/task-activity-events'
import type { TaskActivityEntry } from '@/entities/task/model/task-activity'

export function useInboxActivity(projectId: string, taskIds: string[]) {
  const [state, setState] = useState<{
    entries: TaskActivityEntry[]
    status: 'loading' | 'ready' | 'error'
  }>({ entries: [], status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const taskIdsKey = JSON.stringify(taskIds)
  useEffect(() => {
    let active = true
    let revision = 0
    async function load() {
      const request = ++revision
      try {
        const entries = await loadProjectActivityFromIndexedDb(
          projectId,
          JSON.parse(taskIdsKey) as string[],
        )
        if (active && request === revision)
          setState({ entries, status: 'ready' })
      } catch {
        if (active && request === revision)
          setState((current) => ({ ...current, status: 'error' }))
      }
    }
    void load()
    const unsubscribe = subscribeTaskActivity(projectId, () => void load())
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [projectId, taskIdsKey, attempt])
  return { ...state, retry: () => setAttempt((value) => value + 1) }
}
