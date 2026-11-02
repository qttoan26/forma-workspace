import type { Task } from '@/entities/task/model/task'
import { initialTasks } from './project-board-data'

// Recognize only the previous shipped sample titles. Renamed/custom tasks,
// user-created tasks, IDs and saved workflow/assignment/date changes survive.
const legacyTitles: Record<string, string> = {
  'FOR-12': 'Define workspace navigation',
  'FOR-18': 'Create board interaction model',
  'FOR-21': 'Build accessible task cards',
  'FOR-07': 'Document product principles',
}

export function upgradeDemoTasks(tasks: Task[]): Task[] {
  if (
    !tasks.some(
      (task) =>
        task.projectId === 'project-1' && legacyTitles[task.id] === task.title,
    )
  )
    return tasks
  const seedById = new Map(initialTasks.map((task) => [task.id, task]))
  const existingIds = new Set(tasks.map((task) => task.id))
  return [
    ...tasks.map((task) => {
      const seed = seedById.get(task.id)
      if (
        !seed ||
        task.projectId !== seed.projectId ||
        legacyTitles[task.id] !== task.title
      )
        return task
      return {
        ...task,
        title: seed.title,
        description: task.description ?? seed.description,
      }
    }),
    ...initialTasks.filter(
      (task) => !legacyTitles[task.id] && !existingIds.has(task.id),
    ),
  ]
}
