import {
  createTaskActivityEntry,
  taskActivityEntrySchema,
} from './task-activity'

describe('task activity model', () => {
  it('creates a scoped comment entry with a stable timestamp', () => {
    const entry = createTaskActivityEntry({
      projectId: 'project-1',
      taskId: 'FOR-18',
      kind: 'comment',
      body: '  Ready for review  ',
      authorLabel: 'You',
      createdAt: '2026-10-31T05:00:00.000Z',
    })

    expect(entry).toMatchObject({
      projectId: 'project-1',
      taskId: 'FOR-18',
      kind: 'comment',
      body: 'Ready for review',
      authorLabel: 'You',
      createdAt: '2026-10-31T05:00:00.000Z',
    })
    expect(entry.id).toBeTruthy()
  })

  it('rejects empty activity bodies', () => {
    expect(() =>
      taskActivityEntrySchema.parse({
        id: 'activity-1',
        projectId: 'project-1',
        taskId: 'FOR-18',
        kind: 'event',
        body: '   ',
        createdAt: '2026-10-31T05:00:00.000Z',
      }),
    ).toThrow()
  })
})
