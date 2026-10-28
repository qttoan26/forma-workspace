import { z } from 'zod'

const requiredProjectText = z.string().trim().min(1)

export const projectSchema = z.object({
  id: requiredProjectText,
  workspaceId: requiredProjectText,
  name: requiredProjectText,
  key: requiredProjectText,
  description: z.string().trim(),
})

export type Project = z.infer<typeof projectSchema>
