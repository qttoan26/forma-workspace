import { loadConfiguredProjectTasks } from '@/entities/task/lib/task-persistence'
import { getTaskApiBaseUrl } from '@/entities/task/lib/task-api'
import { saveProjectTasksToIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { saveProjectTasks } from '@/entities/task/lib/task-storage'
import { isDemoMode } from '@/shared/auth/auth-session'
import { readLocalProjects } from '@/entities/project/lib/project-catalog'
import { currentDemoMember } from '@/shared/demo/demo-members'
import { upgradeDemoTasks } from './upgrade-demo-tasks'

import { initialTasks, members, project, workspace } from './project-board-data'
import {
  parseProjectBoardData,
  type ProjectBoardData,
} from './project-board-data-parser'

export interface GetProjectBoardInput {
  workspaceSlug: string
  projectId: string
  accountId?: string | undefined
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

    if (workspace.slug !== workspaceSlug) {
      throw new ProjectBoardNotFoundError(input)
    }

    const accountId =
      input.accountId ?? (isDemoMode() ? currentDemoMember.id : undefined)
    const selected =
      projectId === project.id
        ? project
        : accountId
          ? (
              await readLocalProjects({ accountId, workspaceId: workspace.id })
            ).find((candidate) => candidate.id === projectId)
          : undefined
    if (!selected) throw new ProjectBoardNotFoundError(input)

    const saved = await loadConfiguredProjectTasks(
      selected.id,
      selected.id === project.id ? initialTasks : [],
    )
    const tasks =
      selected.id === project.id && isDemoMode() && !getTaskApiBaseUrl()
        ? upgradeDemoTasks(saved)
        : saved
    if (tasks !== saved) {
      await saveProjectTasksToIndexedDb(project.id, tasks).catch(() =>
        saveProjectTasks(project.id, tasks),
      )
    }

    return parseProjectBoardData({
      workspace,
      project: selected,
      members: selected.id === project.id ? members : [],
      initialTasks: tasks,
    })
  },
}
