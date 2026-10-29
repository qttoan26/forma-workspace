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

export function ProjectLiveTaskBoard(props: ProjectLiveTaskBoardProps) {
  const { projectId, initialTasks } = props
  const [snapshot, setSnapshot] = useState({
    tasks: initialTasks,
    revision: -1,
  })

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

  return (
    <ProjectTaskBoardSnapshot
      key={snapshot.revision}
      {...props}
      initialTasks={snapshot.tasks}
    />
  )
}

function ProjectTaskBoardSnapshot({
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
  const mutationAdapter = useMemo(
    () => createConfiguredTaskMutationAdapter(onPersistenceFailure),
    [onPersistenceFailure],
  )

  return (
    <TaskBoard
      projectId={projectId}
      taskIdPrefix={taskIdPrefix}
      initialTasks={initialTasks}
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
