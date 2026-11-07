import { z } from 'zod'

import {
  taskDescriptionSchema,
  taskDueDateSchema,
  taskEstimateMinutesSchema,
  taskPrioritySchema,
  taskStatusSchema,
  taskTitleSchema,
  validateTaskSchedule,
} from '@/entities/task/model/task'

const optionalDate = taskDueDateSchema.or(z.literal(''))

export const taskFormSchema = z
  .object({
    title: taskTitleSchema,
    description: taskDescriptionSchema,
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    assigneeId: z.string(),
    startDate: optionalDate,
    dueDate: optionalDate,
    deadline: optionalDate,
    estimateMinutes: z
      .string()
      .refine(
        (value) =>
          value === '' ||
          taskEstimateMinutesSchema.safeParse(Number(value)).success,
        'Estimate must be a positive whole number of minutes',
      ),
  })
  .superRefine(validateTaskSchedule)

export type TaskFormValues = z.infer<typeof taskFormSchema>
