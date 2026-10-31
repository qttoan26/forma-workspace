import { useMemo } from 'react'

import type { Member } from '@/entities/member/model/member'
import { notifyProjectTasks } from '@/entities/task/lib/task-broadcast'
import type { TaskMutationAdapter } from '@/entities/task/lib/task-mutation-adapter'
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
  editorOnly?: boolean
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
  editorOnly = false,
}: ProjectLiveTaskBoardProps) {
  const mutationAdapter = useMemo(() => {
    const adapter = createConfiguredTaskMutationAdapter(onPersistenceFailure)
    if (!editorOnly) return adapter

    return createLocalNotifyingMutationAdapter(adapter)
  }, [editorOnly, onPersistenceFailure])

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
      editorOnly={editorOnly}
    />
  )
}

function createLocalNotifyingMutationAdapter(
  adapter: TaskMutationAdapter,
): TaskMutationAdapter {
  return {
    async persist(projectId, tasks) {
      await adapter.persist(projectId, tasks)
      notifyProjectTasks(projectId, tasks, null)
    },
  }
}
