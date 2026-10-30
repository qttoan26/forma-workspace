import { projectTasksSchema } from './project-tasks-schema'

describe('project tasks schema', () => {
  const project = {
    id: 'project-1',
    workspaceId: 'ws-1',
    name: 'Product launch',
    key: 'FOR',
    description: 'Launch project',
  }

  const task = {
    id: 'FOR-01',
    projectId: project.id,
    title: 'Validate project links',
    status: 'todo' as const,
    priority: 'medium' as const,
  }

  it('accepts tasks that belong to the project', () => {
    const result = projectTasksSchema.safeParse({ project, tasks: [task] })

    expect(result.success).toBe(true)
  })

  it('rejects tasks that belong to another project', () => {
    const result = projectTasksSchema.safeParse({
      project,
      tasks: [{ ...task, projectId: 'project-2' }],
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.path).toEqual(['tasks', 0, 'projectId'])
  })
})
