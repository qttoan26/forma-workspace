import { describe, expect, it } from 'vitest'

import { projectBoardRepository } from './project-board-repository'

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

  it('rejects unknown route identities', async () => {
    await expect(
      projectBoardRepository.getProjectBoard({
        workspaceSlug: 'forma',
        projectId: 'missing-project',
      }),
    ).rejects.toThrow('Project board not found')
  })
})
