import { projectWorkspaceSchema } from './project-workspace-schema'

describe('project workspace schema', () => {
  const workspace = {
    id: 'ws-1',
    name: 'Forma',
    slug: 'forma',
  }

  const project = {
    id: 'project-1',
    workspaceId: workspace.id,
    name: 'Product launch',
    key: 'FOR',
    description: 'Launch project',
  }

  it('accepts a project that belongs to the workspace', () => {
    const result = projectWorkspaceSchema.safeParse({ workspace, project })

    expect(result.success).toBe(true)
  })

  it('rejects a project that belongs to another workspace', () => {
    const result = projectWorkspaceSchema.safeParse({
      workspace,
      project: { ...project, workspaceId: 'ws-2' },
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.path).toEqual(['project', 'workspaceId'])
  })
})
