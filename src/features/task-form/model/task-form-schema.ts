import { z } from 'zod'

import {
  taskDescriptionSchema,
  taskDueDateSchema,
  taskPrioritySchema,
  taskStatusSchema,
  taskTitleSchema,
} from '@/entities/task/model/task'

export const taskFormSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: z.string(),
  dueDate: taskDueDateSchema.or(z.literal('')),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
