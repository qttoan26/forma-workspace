import { z } from 'zod'

const requiredMemberText = z.string().trim().min(1)

export const memberSchema = z.object({
  id: requiredMemberText,
  name: requiredMemberText,
  initials: requiredMemberText,
  role: requiredMemberText,
})

export type Member = z.infer<typeof memberSchema>
