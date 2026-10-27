import { z } from 'zod'

import { taskPriorities, type TaskPriority } from '@/entities/task/model/task'

const optionalSearchText = z.preprocess(
  normalizeOptionalText,
  z.string().optional(),
)

const optionalPriority = z.preprocess(
  (value) =>
    typeof value === 'string' && taskPriorities.includes(value as TaskPriority)
      ? value
      : undefined,
  z.enum(taskPriorities).optional(),
)

const optionalNewTask = z.preprocess(
  (value) => (value === '1' ? value : undefined),
  z.literal('1').optional(),
)

export const projectBoardSearchSchema = z.object({
  priority: optionalPriority,
  assignee: optionalSearchText,
  query: optionalSearchText,
  task: optionalSearchText,
  newTask: optionalNewTask,
})

export function parseProjectBoardSearch(search: Record<string, unknown>) {
  const parsed = projectBoardSearchSchema.parse(search)

  return parsed.newTask === '1' ? { ...parsed, task: undefined } : parsed
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}
