import { loadConfiguredProjectTasks } from '@/entities/task/lib/task-persistence'
import { getTaskApiBaseUrl } from '@/entities/task/lib/task-api'
import { saveProjectTasksToIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { saveProjectTasks } from '@/entities/task/lib/task-storage'
import { isDemoMode } from '@/shared/auth/auth-session'
import { upgradeDemoTasks } from './upgrade-demo-tasks'

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

    const saved = await loadConfiguredProjectTasks(project.id, initialTasks)
    const tasks =
      isDemoMode() && !getTaskApiBaseUrl() ? upgradeDemoTasks(saved) : saved
    if (tasks !== saved) {
      await saveProjectTasksToIndexedDb(project.id, tasks).catch(() =>
        saveProjectTasks(project.id, tasks),
      )
    }

    return parseProjectBoardData({
      workspace,
      project,
      members,
      initialTasks: tasks,
    })
  },
}
