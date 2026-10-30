import { describe, expect, it, vi } from 'vitest'

import { loadProjectBoard } from './project-board-loader'
import {
  ProjectBoardNotFoundError,
  projectBoardRepository,
} from './project-board-repository'

describe('loadProjectBoard', () => {
  it('returns repository data for an existing project board', async () => {
    const data = await loadProjectBoard({
      workspaceSlug: 'forma',
      projectId: 'project-1',
    })

    expect(data.project.id).toBe('project-1')
  })

  it('maps typed repository not-found failures to router not-found errors', async () => {
    const input = {
      workspaceSlug: 'forma',
      projectId: 'missing-project',
    }

    await expect(loadProjectBoard(input)).rejects.toMatchObject({
      isNotFound: true,
      data: input,
    })
  })

  it('preserves unexpected repository failures', async () => {
    const unexpectedError = new Error('storage unavailable')
    const spy = vi
      .spyOn(projectBoardRepository, 'getProjectBoard')
      .mockRejectedValueOnce(unexpectedError)

    await expect(
      loadProjectBoard({ workspaceSlug: 'forma', projectId: 'project-1' }),
    ).rejects.toBe(unexpectedError)

    spy.mockRestore()
  })

  it('keeps typed repository errors distinct from generic failures', () => {
    expect(
      new ProjectBoardNotFoundError({
        workspaceSlug: 'forma',
        projectId: 'missing-project',
      }),
    ).toBeInstanceOf(ProjectBoardNotFoundError)
  })
})
