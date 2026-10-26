import { z } from 'zod'

import { taskPriorities, taskStatuses } from '@/entities/task/model/task'

export const taskFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less'),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  assigneeId: z.string(),
  dueDate: z.string(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
