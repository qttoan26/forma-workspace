import { describe, expect, it } from 'vitest'

import {
  ProjectBoardNotFoundError,
  projectBoardRepository,
} from './project-board-repository'

describe('projectBoardRepository', () => {
  it('loads the matching project board snapshot', async () => {
    const data = await projectBoardRepository.getProjectBoard({
      workspaceSlug: 'forma',
      projectId: 'project-1',
    })

    expect(data.workspace.slug).toBe('forma')
    expect(data.project.id).toBe('project-1')
    expect(data.initialTasks).not.toHaveLength(0)
  })

  it('rejects unknown route identities with a typed not-found error', async () => {
    const input = {
      workspaceSlug: 'forma',
      projectId: 'missing-project',
    }

    const error = await projectBoardRepository
      .getProjectBoard(input)
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ProjectBoardNotFoundError)
    expect(error).toMatchObject({
      name: 'ProjectBoardNotFoundError',
      input,
    })
  })
})
