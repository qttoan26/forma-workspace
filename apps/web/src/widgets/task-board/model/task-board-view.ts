import {
  taskStatuses,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task/model/task'

export const taskBoardSorts = ['priority', 'due-date'] as const
export type TaskBoardSort = (typeof taskBoardSorts)[number]

export interface TaskBoardFilters {
  priority?: TaskPriority
  assigneeId?: string
  query?: string
  sort?: TaskBoardSort
}

export type TaskColumns = Record<TaskStatus, Task[]>

const priorityRank: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function filterTasks(tasks: Task[], filters?: TaskBoardFilters) {
  const normalizedQuery = filters?.query?.trim().toLocaleLowerCase()
  const filtered = tasks.filter(
    (task) =>
      (!filters?.priority || task.priority === filters.priority) &&
      (!filters?.assigneeId || task.assigneeId === filters.assigneeId) &&
      (!normalizedQuery || matchesTaskQuery(task, normalizedQuery)),
  )

  return sortTasks(filtered, filters?.sort)
}

export function sortTasks(tasks: Task[], sort?: TaskBoardSort) {
  if (!sort) return tasks

  return [...tasks].sort((left, right) => {
    if (sort === 'priority') {
      return priorityRank[left.priority] - priorityRank[right.priority]
    }

    if (!left.dueDate && !right.dueDate) return 0
    if (!left.dueDate) return 1
    if (!right.dueDate) return -1
    return left.dueDate.localeCompare(right.dueDate)
  })
}

function matchesTaskQuery(task: Task, normalizedQuery: string) {
  return (
    task.title.toLocaleLowerCase().includes(normalizedQuery) ||
    task.id.toLocaleLowerCase().includes(normalizedQuery) ||
    task.description?.toLocaleLowerCase().includes(normalizedQuery) === true
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
  return tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
}
