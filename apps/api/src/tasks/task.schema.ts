import { z } from 'zod'

export const taskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['backlog', 'todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().min(1).optional(),
  dueDate: z.string().optional(),
})

export const persistTasksBodySchema = z.object({
  tasks: z.array(taskSchema),
})

export type TaskRecord = z.infer<typeof taskSchema>
