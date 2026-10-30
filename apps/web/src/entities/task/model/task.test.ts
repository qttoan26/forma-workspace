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

    const result = taskSchema.safeParse({
      ...baseTask,
      dueDate: '2026-10-29',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-ISO due dates', () => {
    expect(taskDueDateSchema.safeParse('29/10/2026').success).toBe(false)

    const result = taskSchema.safeParse({
      ...baseTask,
      dueDate: '29/10/2026',
    })
    expect(result.success).toBe(false)
  })

  it('keeps due dates optional', () => {
    expect(taskSchema.safeParse(baseTask).success).toBe(true)
  })

  it('shares title validation with persisted tasks', () => {
    const validTitle = taskTitleSchema.safeParse('  Valid title  ')
    expect(validTitle.data).toBe('Valid title')
    expect(taskTitleSchema.safeParse('ab').success).toBe(false)

    const persistedTask = taskSchema.safeParse({ ...baseTask, title: 'ab' })
    expect(persistedTask.success).toBe(false)
  })

  it('shares description limits with persisted tasks', () => {
    const validDescription = taskDescriptionSchema.safeParse('  Details  ')
    expect(validDescription.data).toBe('Details')

    const overlongDescription = 'x'.repeat(501)
    expect(taskDescriptionSchema.safeParse(overlongDescription).success).toBe(
      false,
    )

    const persistedTask = taskSchema.safeParse({
      ...baseTask,
      description: overlongDescription,
    })
    expect(persistedTask.success).toBe(false)
  })
})
