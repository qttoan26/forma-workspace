import {
  taskDescriptionSchema,
  taskDueDateSchema,
  taskSchema,
  taskTitleSchema,
} from './task'

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

  it('shares title validation with persisted tasks', () => {
    expect(taskTitleSchema.safeParse('  Valid title  ').data).toBe(
      'Valid title',
    )
    expect(taskTitleSchema.safeParse('ab').success).toBe(false)
    expect(
      taskSchema.safeParse({ ...baseTask, title: 'ab' }).success,
    ).toBe(false)
  })

  it('shares description limits with persisted tasks', () => {
    expect(taskDescriptionSchema.safeParse('  Details  ').data).toBe('Details')
    expect(taskDescriptionSchema.safeParse('x'.repeat(501)).success).toBe(false)
    expect(
      taskSchema.safeParse({ ...baseTask, description: 'x'.repeat(501) }).success,
    ).toBe(false)
  })
})
