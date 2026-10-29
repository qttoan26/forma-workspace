import { afterEach } from 'vitest'

import type { Task } from '@/entities/task/model/task'

import {
  clearMemoryProjectTaskSync,
  completeMemoryProjectTaskSync,
  enqueueMemoryProjectTaskSync,
  loadMemoryProjectTaskSync,
} from './task-memory-sync-queue'

const projectId = 'project-1'

const firstTask: Task = {
  id: 'task-1',
  projectId,
  title: 'First task',
  status: 'todo',
  priority: 'medium',
}

const secondTask: Task = {
  id: 'task-2',
  projectId,
  title: 'Second task',
  status: 'in-progress',
  priority: 'high',
}

afterEach(() => {
  clearMemoryProjectTaskSync(projectId)
})

describe('task memory sync queue', () => {
  it('keeps the latest project mutation in memory', () => {
    enqueueMemoryProjectTaskSync(projectId, [firstTask])
    const latest = enqueueMemoryProjectTaskSync(projectId, [secondTask])

    expect(loadMemoryProjectTaskSync(projectId)).toEqual(latest)
    expect(latest.tasks).toEqual([secondTask])
  })

  it('only completes the matching queued mutation', () => {
    const queuedSync = enqueueMemoryProjectTaskSync(projectId, [firstTask])

    expect(completeMemoryProjectTaskSync(projectId, 'stale-mutation')).toBe(
      false,
    )
    expect(loadMemoryProjectTaskSync(projectId)).toEqual(queuedSync)

    expect(
      completeMemoryProjectTaskSync(projectId, queuedSync.mutationId),
    ).toBe(true)
    expect(loadMemoryProjectTaskSync(projectId)).toBeNull()
  })

  it('rejects tasks from another project', () => {
    expect(() =>
      enqueueMemoryProjectTaskSync(projectId, [
        { ...firstTask, projectId: 'project-2' },
      ]),
    ).toThrow('Task collection does not match project')
  })
})
