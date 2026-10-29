import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Task } from '@/entities/task/model/task'

import {
  createApiTaskMutationAdapter,
  loadProjectTasksFromApi,
} from './task-api'

const task: Task = {
  id: 'FOR-501',
  projectId: 'project-forma',
  title: 'Persist API tasks',
  status: 'todo',
  priority: 'high',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('task API', () => {
  it('loads and validates project tasks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tasks: [task] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loadProjectTasksFromApi('project-forma', 'https://api.example.test'),
    ).resolves.toEqual([task])
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
    )
  })

  it('persists task mutations after the initial board sync', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const adapter = createApiTaskMutationAdapter('https://api.example.test')

    await adapter.persist('project-forma', [task])
    await adapter.persist('project-forma', [task])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: [task] }),
      },
    )
  })
})
