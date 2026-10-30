import { afterEach } from 'vitest'

import type { Task } from '@/entities/task/model/task'

import {
  clearSessionProjectTaskSync,
  completeSessionProjectTaskSync,
  enqueueSessionProjectTaskSync,
  loadSessionProjectTaskSync,
} from './task-session-sync-queue'

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
  clearSessionProjectTaskSync(projectId)
  clearSessionProjectTaskSync('project-2')
})

describe('task session sync queue', () => {
  it('survives module-level reads through sessionStorage', () => {
    const queuedSync = enqueueSessionProjectTaskSync(projectId, [firstTask])

    expect(queuedSync).not.toBeNull()
    expect(loadSessionProjectTaskSync(projectId)).toEqual(queuedSync)
  })

  it('preserves the expected server revision through sessionStorage', () => {
    const queuedSync = enqueueSessionProjectTaskSync(projectId, [firstTask], 5)

    expect(queuedSync?.expectedRevision).toBe(5)
    expect(loadSessionProjectTaskSync(projectId)).toEqual(queuedSync)
  })

  it('keeps the latest project mutation', () => {
    enqueueSessionProjectTaskSync(projectId, [firstTask])
    const latest = enqueueSessionProjectTaskSync(projectId, [secondTask])

    expect(loadSessionProjectTaskSync(projectId)).toEqual(latest)
    expect(latest?.tasks).toEqual([secondTask])
  })

  it('only completes the matching mutation', () => {
    const queuedSync = enqueueSessionProjectTaskSync(projectId, [firstTask])
    expect(queuedSync).not.toBeNull()

    expect(completeSessionProjectTaskSync(projectId, 'stale-mutation')).toBe(
      false,
    )
    expect(loadSessionProjectTaskSync(projectId)).toEqual(queuedSync)

    expect(
      completeSessionProjectTaskSync(projectId, queuedSync!.mutationId),
    ).toBe(true)
    expect(loadSessionProjectTaskSync(projectId)).toBeNull()
  })

  it('rejects tasks from another project', () => {
    expect(() =>
      enqueueSessionProjectTaskSync(projectId, [
        { ...firstTask, projectId: 'project-2' },
      ]),
    ).toThrow('Task collection does not match project')
  })

  it('removes invalid persisted queue data', () => {
    sessionStorage.setItem(
      'forma:task-sync:v1:queue:project-2',
      JSON.stringify({ projectId: 'project-2', tasks: 'invalid' }),
    )

    expect(loadSessionProjectTaskSync('project-2')).toBeNull()
    expect(
      sessionStorage.getItem('forma:task-sync:v1:queue:project-2'),
    ).toBeNull()
  })
})
