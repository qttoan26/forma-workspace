import { workspaceSchema } from './workspace'

describe('workspace schema', () => {
  it('normalizes valid workspace text fields', () => {
    const result = workspaceSchema.parse({
      id: ' ws-1 ',
      name: ' Forma ',
      slug: ' forma ',
    })

    expect(result).toEqual({
      id: 'ws-1',
      name: 'Forma',
      slug: 'forma',
    })
  })

  it('rejects blank required fields', () => {
    expect(
      workspaceSchema.safeParse({ id: ' ', name: 'Forma', slug: 'forma' })
        .success,
    ).toBe(false)
    expect(
      workspaceSchema.safeParse({ id: 'ws-1', name: ' ', slug: 'forma' })
        .success,
    ).toBe(false)
    expect(
      workspaceSchema.safeParse({ id: 'ws-1', name: 'Forma', slug: ' ' })
        .success,
    ).toBe(false)
  })
})
