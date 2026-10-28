import { initialTasks, members, project, workspace } from './project-board-data'
import {
  parseProjectBoardData,
  type ProjectBoardData,
} from './project-board-data-parser'

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

    return Promise.resolve(
      parseProjectBoardData({
        workspace,
        project,
        members,
        initialTasks,
      }),
    )
  },
}
