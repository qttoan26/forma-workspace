import { z } from 'zod'

import { calendarDate } from '@/shared/lib/local-date-key'

export const taskStatuses = ['backlog', 'todo', 'in-progress', 'done'] as const
export const taskStatusSchema = z.enum(taskStatuses)
export type TaskStatus = z.infer<typeof taskStatusSchema>

export const taskPriorities = ['low', 'medium', 'high', 'urgent'] as const
export const taskPrioritySchema = z.enum(taskPriorities)
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const taskTitleSchema = z
  .string()
  .trim()
  .min(3, 'Title must be at least 3 characters')

export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description must be 500 characters or less')

export const taskDueDateSchema = z.iso.date()
export const taskEstimateMinutesSchema = z.number().int().positive()

export function validateTaskSchedule(
  dates: {
    startDate?: string | undefined
    dueDate?: string | undefined
    deadline?: string | undefined
  },
  context: z.RefinementCtx,
) {
  if (!dates.startDate) return

  for (const field of ['dueDate', 'deadline'] as const) {
    const date = dates[field]
    if (date && date < dates.startDate) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field === 'dueDate' ? 'Due date' : 'Deadline'} cannot be before the start date`,
      })
    }
  }
}

export const taskSchema = z
  .object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    title: taskTitleSchema,
    description: taskDescriptionSchema.optional(),
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    assigneeId: z.string().optional(),
    startDate: taskDueDateSchema.optional(),
    dueDate: taskDueDateSchema.optional(),
    deadline: taskDueDateSchema.optional(),
    estimateMinutes: taskEstimateMinutesSchema.optional(),
  })
  .superRefine(validateTaskSchedule)

export const taskCollectionSchema = z
  .array(taskSchema)
  .superRefine((tasks, ctx) => {
    const seenTaskIds = new Set<string>()

    tasks.forEach((task, index) => {
      if (!seenTaskIds.has(task.id)) {
        seenTaskIds.add(task.id)
        return
      }

      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `Duplicate task ID: ${task.id}`,
      })
    })
  })

export type Task = z.infer<typeof taskSchema>

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}

export function getTaskDeadline(task: Task) {
  return task.deadline ?? task.dueDate
}

export function isTaskOverdue(task: Task, today: string) {
  const deadline = getTaskDeadline(task)
  return task.status !== 'done' && Boolean(deadline && deadline < today)
}

export function getTaskDeadlineState(task: Task, today: string) {
  const deadline = getTaskDeadline(task)
  if (!deadline || task.status === 'done') return undefined
  if (isTaskOverdue(task, today)) return 'overdue'

  const warningEnd = calendarDate(today)
  warningEnd.setUTCDate(warningEnd.getUTCDate() + 3)
  return calendarDate(deadline) <= warningEnd ? 'due-soon' : undefined
}
