import { z } from 'zod'

import { memberSchema } from '@/entities/member/model/member'
import { projectSchema } from '@/entities/project/model/project'
import { taskCollectionSchema } from '@/entities/task/model/task'
import { workspaceSchema } from '@/entities/workspace/model/workspace'

import { projectTasksSchema } from './project-tasks-schema'
import { projectWorkspaceSchema } from './project-workspace-schema'
import { taskAssigneesSchema } from './task-assignees-schema'

const projectBoardDataSchema = z.object({
  workspace: workspaceSchema,
  project: projectSchema,
  members: z.array(memberSchema),
  initialTasks: taskCollectionSchema,
})

export type ProjectBoardData = z.infer<typeof projectBoardDataSchema>

export function parseProjectBoardData(input: unknown): ProjectBoardData {
  const data = projectBoardDataSchema.parse(input)

  projectWorkspaceSchema.parse({
    workspace: data.workspace,
    project: data.project,
  })

  projectTasksSchema.parse({
    project: data.project,
    tasks: data.initialTasks,
  })

  taskAssigneesSchema.parse({
    members: data.members,
    tasks: data.initialTasks,
  })

  return data
}
