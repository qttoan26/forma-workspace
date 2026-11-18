import { z } from 'zod'

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, 'Enter a project name.').max(120),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z][A-Z0-9]{1,9}$/,
      'Use 2–10 letters or numbers, starting with a letter.',
    ),
  description: z.string().trim().max(2000),
})

export type ProjectCreateValues = z.infer<typeof projectCreateSchema>
