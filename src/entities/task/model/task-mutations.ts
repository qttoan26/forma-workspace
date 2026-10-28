import type { Task, TaskStatus } from './task'

export interface TaskWriteValues {
  title: Task['title']
  status: Task['status']
  priority: Task['priority']
  description?: Task['description']
  assigneeId?: Task['assigneeId']
  dueDate?: Task['dueDate']
}

export interface DeletedTaskSnapshot {
  task: Task
  index: number
}

interface TaskRemovalResult {
  tasks: Task[]
  deletedTask: DeletedTaskSnapshot | null
}

export function appendTask(tasks: Task[], task: Task): Task[] {
  return [...tasks, task]
}

export function updateTaskValues(
  tasks: Task[],
  taskId: string,
  values: TaskWriteValues,
): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          id: task.id,
          projectId: task.projectId,
          ...values,
        }
      : task,
  )
}

export function moveTaskToStatus(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
): Task[] {
  return tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
}

export function removeTask(tasks: Task[], taskId: string): TaskRemovalResult {
  const index = tasks.findIndex((task) => task.id === taskId)
  if (index === -1) return { tasks, deletedTask: null }

  const task = tasks[index]
  if (!task) return { tasks, deletedTask: null }

  return {
    tasks: tasks.filter((item) => item.id !== taskId),
    deletedTask: { task, index },
  }
}

export function restoreTask(
  tasks: Task[],
  deletedTask: DeletedTaskSnapshot,
): Task[] {
  if (tasks.some((task) => task.id === deletedTask.task.id)) return tasks

  const index = Math.min(deletedTask.index, tasks.length)
  return [
    ...tasks.slice(0, index),
    deletedTask.task,
    ...tasks.slice(index),
  ]
}
