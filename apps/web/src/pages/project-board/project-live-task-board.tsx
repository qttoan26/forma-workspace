import { useMemo } from 'react'

import type { Member } from '@/entities/member/model/member'
import { createConfiguredTaskMutationAdapter } from '@/entities/task/lib/task-persistence'
import type { Task } from '@/entities/task/model/task'
import type { TaskBoardFilters } from '@/widgets/task-board/model/task-board-view'
import { TaskBoard } from '@/widgets/task-board/task-board'

import { useProjectLiveTasks } from './use-project-live-tasks'

export interface ProjectLiveTaskBoardProps {
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
  const snapshot = useProjectLiveTasks(projectId, initialTasks)

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
