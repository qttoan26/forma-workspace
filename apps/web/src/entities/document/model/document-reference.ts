import { z } from 'zod'

export const documentReferenceSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(500),
  location: z.string().trim().min(1).max(4000),
  createdAt: z.string().min(1),
})

export const documentReferenceCollectionSchema = z.array(documentReferenceSchema)

export type DocumentReference = z.infer<typeof documentReferenceSchema>

export function createDocumentReference(input: {
  projectId: string
  taskId?: string
  name: string
  location: string
}): DocumentReference {
  return documentReferenceSchema.parse({
    id:
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`,
    projectId: input.projectId,
    ...(input.taskId ? { taskId: input.taskId } : {}),
    name: input.name,
    location: input.location,
    createdAt: new Date().toISOString(),
  })
}
