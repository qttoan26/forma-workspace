import type { Member } from '@/entities/member/model/member'
import type { Project } from '@/entities/project/model/project'
import type { Task } from '@/entities/task/model/task'
import type { Workspace } from '@/entities/workspace/model/workspace'

import { initialTasks, members, project, workspace } from './project-board-data'

export interface ProjectBoardData {
  workspace: Workspace
  project: Project
  members: Member[]
  initialTasks: Task[]
}

export interface ProjectBoardRepository {
  getProjectBoard: (input: {
    workspaceSlug: string
    projectId: string
  }) => Promise<ProjectBoardData>
}

export const projectBoardRepository: ProjectBoardRepository = {
  getProjectBoard({ workspaceSlug, projectId }) {
    if (workspace.slug !== workspaceSlug || project.id !== projectId) {
      return Promise.reject(new Error('Project board not found'))
    }

    return Promise.resolve({
      workspace,
      project,
      members,
      initialTasks,
    })
  },
}
