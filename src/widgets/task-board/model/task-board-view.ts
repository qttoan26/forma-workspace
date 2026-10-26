import {
  taskStatuses,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task/model/task'

export interface TaskBoardFilters {
  priority?: TaskPriority
  assigneeId?: string
  query?: string
}

export type TaskColumns = Record<TaskStatus, Task[]>

export function filterTasks(tasks: Task[], filters?: TaskBoardFilters) {
  const normalizedQuery = filters?.query?.trim().toLocaleLowerCase()

  return tasks.filter(
    (task) =>
      (!filters?.priority || task.priority === filters.priority) &&
      (!filters?.assigneeId || task.assigneeId === filters.assigneeId) &&
      (!normalizedQuery ||
        task.title.toLocaleLowerCase().includes(normalizedQuery) ||
        task.id.toLocaleLowerCase().includes(normalizedQuery)),
  )
}

export function groupTasksByStatus(tasks: Task[]): TaskColumns {
  const columns = Object.fromEntries(
    taskStatuses.map((status) => [status, [] as Task[]]),
  ) as TaskColumns

  for (const task of tasks) {
    columns[task.status].push(task)
  }

  return columns
}

export function updateTaskStatus(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
) {
  return tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  )
}
