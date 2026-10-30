import { projectSchema } from './project'

describe('project schema', () => {
  it('trims valid project fields', () => {
    const result = projectSchema.parse({
      id: ' project-1 ',
      workspaceId: ' ws-1 ',
      name: ' Product launch ',
      key: ' FOR ',
      description: ' Ship the first release. ',
    })

    expect(result).toEqual({
      id: 'project-1',
      workspaceId: 'ws-1',
      name: 'Product launch',
      key: 'FOR',
      description: 'Ship the first release.',
    })
  })

  it('rejects blank required identifiers and names', () => {
    expect(
      projectSchema.safeParse({
        id: 'project-1',
        workspaceId: '   ',
        name: 'Product launch',
        key: 'FOR',
        description: '',
      }).success,
    ).toBe(false)
  })

  it('allows an empty project description', () => {
    expect(
      projectSchema.safeParse({
        id: 'project-1',
        workspaceId: 'ws-1',
        name: 'Product launch',
        key: 'FOR',
        description: '',
      }).success,
    ).toBe(true)
  })
})
