import { useEffect, useState } from 'react'

import { subscribeProjectTasks } from '@/entities/task/lib/task-broadcast'
import type { Task } from '@/entities/task/model/task'

export function useProjectLiveTasks(projectId: string, initialTasks: Task[]) {
  const [snapshot, setSnapshot] = useState({
    tasks: initialTasks,
    revision: -1,
  })

  useEffect(() => {
    setSnapshot({ tasks: initialTasks, revision: -1 })
  }, [initialTasks, projectId])

  useEffect(
    () =>
      subscribeProjectTasks(projectId, (incoming) => {
        setSnapshot((current) => {
          if (incoming.revision <= current.revision) return current

          return {
            tasks: incoming.tasks,
            revision: incoming.revision,
          }
        })
      }),
    [projectId],
  )

  return snapshot
}
