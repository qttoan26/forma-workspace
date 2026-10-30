import { describe, expect, it } from 'vitest'

import { taskAssigneesSchema } from './task-assignees-schema'

const members = [
  { id: 'member-1', name: 'Alex Morgan', initials: 'AM', role: 'Design' },
]

const task = {
  id: 'FOR-1',
  projectId: 'project-1',
  title: 'Validate assignees',
  status: 'todo' as const,
  priority: 'medium' as const,
}

describe('taskAssigneesSchema', () => {
  it('accepts unassigned tasks and known assignees', () => {
    const result = taskAssigneesSchema.safeParse({
      members,
      tasks: [task, { ...task, id: 'FOR-2', assigneeId: 'member-1' }],
    })

    expect(result.success).toBe(true)
  })

  it('rejects task assignees that do not exist in members', () => {
    const result = taskAssigneesSchema.safeParse({
      members,
      tasks: [{ ...task, assigneeId: 'missing-member' }],
    })

    expect(result.success).toBe(false)

    if (result.success) return

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['tasks', 0, 'assigneeId'],
          message: 'Task assigneeId must reference an existing member',
        }),
      ]),
    )
  })
})
