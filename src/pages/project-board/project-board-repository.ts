import {
  getTaskApiBaseUrl,
  loadProjectTasksFromApi,
} from '@/entities/task/lib/task-api'

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
  async getProjectBoard(input) {
    const { workspaceSlug, projectId } = input

    if (workspace.slug !== workspaceSlug || project.id !== projectId) {
      throw new ProjectBoardNotFoundError(input)
    }

    const apiBaseUrl = getTaskApiBaseUrl()
    const tasks = apiBaseUrl
      ? await loadProjectTasksFromApi(project.id, apiBaseUrl)
      : initialTasks

    return parseProjectBoardData({
      workspace,
      project,
      members,
      initialTasks: tasks,
    })
  },
}
