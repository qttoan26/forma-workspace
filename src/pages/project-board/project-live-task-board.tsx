import { useEffect, useMemo, useState } from 'react'

import type { Member } from '@/entities/member/model/member'
import { subscribeProjectTasks } from '@/entities/task/lib/task-broadcast'
import { createConfiguredTaskMutationAdapter } from '@/entities/task/lib/task-persistence'
import type { Task } from '@/entities/task/model/task'
import type { TaskBoardFilters } from '@/widgets/task-board/model/task-board-view'
import { TaskBoard } from '@/widgets/task-board/task-board'

interface ProjectLiveTaskBoardProps {
  projectId: string
  taskIdPrefix: string
  initialTasks: Task[]
  members: Member[]
  selectedTaskId: string | null
  onSelectedTaskChange: (taskId: string | null) => void
  isCreatingTask: boolean
  onCreatingTaskChange: (isCreating: boolean) => void
  filters: TaskBoardFilters
  onPersistenceFailure: () => void
}

export function ProjectLiveTaskBoard({
  projectId,
  taskIdPrefix,
  initialTasks,
  members,
  selectedTaskId,
  onSelectedTaskChange,
  isCreatingTask,
  onCreatingTaskChange,
  filters,
  onPersistenceFailure,
}: ProjectLiveTaskBoardProps) {
  const [snapshot, setSnapshot] = useState({
    tasks: initialTasks,
    revision: 0,
  })

  useEffect(
    () =>
      subscribeProjectTasks(projectId, (tasks) => {
        setSnapshot((current) => ({
          tasks,
          revision: current.revision + 1,
        }))
      }),
    [projectId],
  )

  const mutationAdapter = useMemo(
    () => createConfiguredTaskMutationAdapter(onPersistenceFailure),
    [onPersistenceFailure, snapshot.revision],
  )

  return (
    <TaskBoard
      key={snapshot.revision}
      projectId={projectId}
      taskIdPrefix={taskIdPrefix}
      initialTasks={snapshot.tasks}
      members={members}
      selectedTaskId={selectedTaskId}
      onSelectedTaskChange={onSelectedTaskChange}
      isCreatingTask={isCreatingTask}
      onCreatingTaskChange={onCreatingTaskChange}
      mutationAdapter={mutationAdapter}
      filters={filters}
    />
  )
}
