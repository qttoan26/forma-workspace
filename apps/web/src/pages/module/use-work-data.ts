import { useEffect, useState } from 'react'

import { subscribeProjectTasks } from '@/entities/task/lib/task-broadcast'
import { isDemoMode, loadAuthSession } from '@/shared/auth/auth-session'
import { currentDemoMember } from '@/shared/demo/demo-members'
import { projectBoardRepository } from '@/pages/project-board/project-board-repository'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'

export function useWorkData() {
  const [data, setData] = useState<ProjectBoardData | null>(null)
  const [error, setError] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(() =>
    isDemoMode() ? currentDemoMember.id : undefined,
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let revision = 0
    async function load() {
      const request = ++revision
      try {
        const result = await projectBoardRepository.getProjectBoard({
          workspaceSlug: 'forma',
          projectId: 'project-1',
        })
        if (active && request === revision) {
          setData(result)
          setError(false)
        }
      } catch {
        if (active && request === revision) setError(true)
      }
    }
    void load()
    const unsubscribe = subscribeProjectTasks('project-1', () => {
      void load()
    })
    const onFocus = () => {
      void load()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [attempt])

  useEffect(() => {
    let active = true
    if (!isDemoMode()) {
      void loadAuthSession()
        .then((session) => {
          if (active) setUserId(session?.user.id)
        })
        .catch(() => undefined)
    }
    return () => {
      active = false
    }
  }, [])

  return { data, error, userId, retry: () => setAttempt((value) => value + 1) }
}
