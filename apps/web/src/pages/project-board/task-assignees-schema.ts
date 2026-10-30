import { z } from 'zod'

import { memberSchema } from '@/entities/member/model/member'
import { taskCollectionSchema } from '@/entities/task/model/task'

export const taskAssigneesSchema = z
  .object({
    members: z.array(memberSchema),
    tasks: taskCollectionSchema,
  })
  .superRefine(({ members, tasks }, context) => {
    const memberIds = new Set(members.map((member) => member.id))

    tasks.forEach((task, index) => {
      if (!task.assigneeId || memberIds.has(task.assigneeId)) return

      context.addIssue({
        code: 'custom',
        path: ['tasks', index, 'assigneeId'],
        message: 'Task assigneeId must reference an existing member',
      })
    })
  })

export type TaskAssignees = z.infer<typeof taskAssigneesSchema>
