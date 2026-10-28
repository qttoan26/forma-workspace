import { z } from 'zod'

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

export const taskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: taskTitleSchema,
  description: taskDescriptionSchema.optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: z.string().optional(),
  dueDate: taskDueDateSchema.optional(),
})

export const taskCollectionSchema = z.array(taskSchema).superRefine((tasks, ctx) => {
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
