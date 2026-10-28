import { taskDueDateSchema, taskSchema } from './task'

describe('task domain schema', () => {
  const baseTask = {
    id: 'FOR-1',
    projectId: 'project-1',
    title: 'Validate due dates',
    status: 'todo' as const,
    priority: 'medium' as const,
  }

  it('accepts ISO calendar dates', () => {
    expect(taskDueDateSchema.safeParse('2026-10-29').success).toBe(true)
    expect(
      taskSchema.safeParse({ ...baseTask, dueDate: '2026-10-29' }).success,
    ).toBe(true)
  })

  it('rejects non-ISO due dates', () => {
    expect(taskDueDateSchema.safeParse('29/10/2026').success).toBe(false)
    expect(
      taskSchema.safeParse({ ...baseTask, dueDate: '29/10/2026' }).success,
    ).toBe(false)
  })

  it('keeps due dates optional', () => {
    expect(taskSchema.safeParse(baseTask).success).toBe(true)
  })
})
