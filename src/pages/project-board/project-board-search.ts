import { z } from 'zod'

import { taskPriorities } from '@/entities/task/model/task'

const optionalSearchText = z.preprocess(
  normalizeOptionalText,
  z.string().optional(),
)

const optionalPriority = z.preprocess(
  (value) =>
    typeof value === 'string' && taskPriorities.includes(value as never)
      ? value
      : undefined,
  z.enum(taskPriorities).optional(),
)

export const projectBoardSearchSchema = z.object({
  priority: optionalPriority,
  assignee: optionalSearchText,
  query: optionalSearchText,
  task: optionalSearchText,
})

export function parseProjectBoardSearch(search: Record<string, unknown>) {
  return projectBoardSearchSchema.parse(search)
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}
