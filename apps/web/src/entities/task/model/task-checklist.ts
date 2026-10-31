import { z } from 'zod'

export const taskChecklistItemSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const taskChecklistCollectionSchema = z.array(taskChecklistItemSchema)

export type TaskChecklistItem = z.infer<typeof taskChecklistItemSchema>

export function createTaskChecklistItem(input: {
  projectId: string
  taskId: string
  title: string
}): TaskChecklistItem {
  const now = new Date().toISOString()

  return taskChecklistItemSchema.parse({
    id: createChecklistItemId(),
    projectId: input.projectId,
    taskId: input.taskId,
    title: input.title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  })
}

function createChecklistItemId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
