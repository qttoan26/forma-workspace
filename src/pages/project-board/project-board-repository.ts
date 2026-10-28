import { initialTasks, members, project, workspace } from './project-board-data'
import {
  parseProjectBoardData,
  type ProjectBoardData,
} from './project-board-data-parser'

export interface GetProjectBoardInput {
  workspaceSlug: string
  projectId: string
}

export class ProjectBoardNotFoundError extends Error {
  readonly name = 'ProjectBoardNotFoundError'

  constructor(readonly input: GetProjectBoardInput) {
    super(
      `Project board not found for workspace "${input.workspaceSlug}" and project "${input.projectId}"`,
    )
  }
}

export interface ProjectBoardRepository {
  getProjectBoard: (input: GetProjectBoardInput) => Promise<ProjectBoardData>
}

export const projectBoardRepository: ProjectBoardRepository = {
  getProjectBoard(input) {
    const { workspaceSlug, projectId } = input

    if (workspace.slug !== workspaceSlug || project.id !== projectId) {
      return Promise.reject(new ProjectBoardNotFoundError(input))
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
