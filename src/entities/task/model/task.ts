import { z } from 'zod'

export const taskStatuses = ['backlog', 'todo', 'in-progress', 'done'] as const
export const taskStatusSchema = z.enum(taskStatuses)
export type TaskStatus = z.infer<typeof taskStatusSchema>

export const taskPriorities = ['low', 'medium', 'high', 'urgent'] as const
export const taskPrioritySchema = z.enum(taskPriorities)
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const taskDueDateSchema = z.iso.date()

export const taskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: z.string().optional(),
  dueDate: taskDueDateSchema.optional(),
})

export type Task = z.infer<typeof taskSchema>

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}
