export const taskStatuses = ['backlog', 'todo', 'in-progress', 'done'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskPriorities = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof taskPriorities)[number]

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  dueDate?: string
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}
