import { z } from 'zod'

import { projectSchema } from '@/entities/project/model/project'
import { workspaceSchema } from '@/entities/workspace/model/workspace'

export const projectWorkspaceSchema = z
  .object({
    workspace: workspaceSchema,
    project: projectSchema,
  })
  .superRefine(({ workspace, project }, context) => {
    if (project.workspaceId === workspace.id) return

    context.addIssue({
      code: 'custom',
      path: ['project', 'workspaceId'],
      message: 'Project workspaceId must match workspace id',
    })
  })

export type ProjectWorkspace = z.infer<typeof projectWorkspaceSchema>
