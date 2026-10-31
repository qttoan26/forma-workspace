import { z } from 'zod'

export const taskActivityKinds = ['comment', 'event'] as const
export type TaskActivityKind = (typeof taskActivityKinds)[number]

export const taskActivityEntrySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  kind: z.enum(taskActivityKinds),
  body: z.string().trim().min(1).max(4000),
  createdAt: z.string().datetime(),
  authorId: z.string().min(1).optional(),
  authorLabel: z.string().trim().min(1).optional(),
})

export const taskActivityCollectionSchema = z.array(taskActivityEntrySchema)

export type TaskActivityEntry = z.infer<typeof taskActivityEntrySchema>

interface CreateTaskActivityEntryInput {
  projectId: string
  taskId: string
  kind: TaskActivityKind
  body: string
  authorId?: string
  authorLabel?: string
  createdAt?: string
}

export function createTaskActivityEntry(
  input: CreateTaskActivityEntryInput,
): TaskActivityEntry {
  return taskActivityEntrySchema.parse({
    id: createActivityId(),
    projectId: input.projectId,
    taskId: input.taskId,
    kind: input.kind,
    body: input.body,
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...(input.authorId ? { authorId: input.authorId } : {}),
    ...(input.authorLabel ? { authorLabel: input.authorLabel } : {}),
  })
}

function createActivityId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
