import { z } from 'zod'

export const workspaceSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
})

export type Workspace = z.infer<typeof workspaceSchema>
