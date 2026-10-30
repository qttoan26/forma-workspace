import { z } from 'zod'

import { projectSchema } from '@/entities/project/model/project'
import { taskCollectionSchema } from '@/entities/task/model/task'

export const projectTasksSchema = z
  .object({
    project: projectSchema,
    tasks: taskCollectionSchema,
  })
  .superRefine(({ project, tasks }, context) => {
    tasks.forEach((task, index) => {
      if (task.projectId === project.id) return

      context.addIssue({
        code: 'custom',
        path: ['tasks', index, 'projectId'],
        message: 'Task projectId must match project id',
      })
    })
  })

export type ProjectTasks = z.infer<typeof projectTasksSchema>
