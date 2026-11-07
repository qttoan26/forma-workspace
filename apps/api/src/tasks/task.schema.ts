import { z } from 'zod'

const taskSchema = z
  .object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    title: z.string().trim().min(3),
    description: z.string().trim().max(500).optional(),
    status: z.enum(['backlog', 'todo', 'in-progress', 'done']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    assigneeId: z.string().optional(),
    startDate: z.iso.date().optional(),
    dueDate: z.iso.date().optional(),
    deadline: z.iso.date().optional(),
    estimateMinutes: z.number().int().positive().optional(),
  })
  .superRefine((task, context) => {
    if (!task.startDate) return

    for (const field of ['dueDate', 'deadline'] as const) {
      const date = task[field]
      if (date && date < task.startDate) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: `${field === 'dueDate' ? 'Due date' : 'Deadline'} cannot be before the start date`,
        })
      }
    }
  })

const taskCollectionSchema = z.array(taskSchema).superRefine((tasks, ctx) => {
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

export const persistTasksBodySchema = z.object({
  tasks: taskCollectionSchema,
  expectedRevision: z.number().int().nonnegative().optional(),
})

export type TaskRecord = z.infer<typeof taskSchema>
