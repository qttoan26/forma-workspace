import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Task } from '@/entities/task/model/task'
import {
  resetFrontendAuthSessionProvider,
  setFrontendAuthSessionProvider,
} from '@/shared/lib/auth-session'

import {
  createApiTaskMutationAdapter,
  loadProjectTasksFromApi,
  persistProjectTasksToApi,
  ProjectTaskApiConflictError,
  ProjectTaskApiUnauthorizedError,
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
  resetFrontendAuthSessionProvider()
})

describe('task API', () => {
  it('loads and validates project tasks with a server revision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tasks: [task], revision: 4 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loadProjectTasksFromApi('project-forma', 'https://api.example.test'),
    ).resolves.toEqual({ tasks: [task], revision: 4 })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
    )
  })

  it('attaches the current bearer token to project task reads', async () => {
    setFrontendAuthSessionProvider({
      getSubject: () => 'user-1',
      getAccessToken: () => 'token-1',
    })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tasks: [task], revision: 4 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await loadProjectTasksFromApi(
      'project-forma',
      'https://api.example.test',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
      { headers: { Authorization: 'Bearer token-1' } },
    )
  })

  it('sends the expected revision and returns the next server revision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ revision: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      persistProjectTasksToApi(
        'project-forma',
        [task],
        'https://api.example.test',
        4,
      ),
    ).resolves.toBe(5)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: [task], expectedRevision: 4 }),
      },
    )
  })

  it('attaches the current bearer token to project task writes', async () => {
    setFrontendAuthSessionProvider({
      getSubject: () => 'user-1',
      getAccessToken: async () => 'token-1',
    })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ revision: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await persistProjectTasksToApi(
      'project-forma',
      [task],
      'https://api.example.test',
      4,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-1',
        },
        body: JSON.stringify({ tasks: [task], expectedRevision: 4 }),
      },
    )
  })

  it('surfaces authentication failures for project task reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loadProjectTasksFromApi('project-forma', 'https://api.example.test'),
    ).rejects.toBeInstanceOf(ProjectTaskApiUnauthorizedError)
  })

  it('surfaces authentication failures for project task writes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      persistProjectTasksToApi(
        'project-forma',
        [task],
        'https://api.example.test',
      ),
    ).rejects.toBeInstanceOf(ProjectTaskApiUnauthorizedError)
  })

  it('surfaces server revision conflicts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ expectedRevision: 2, actualRevision: 3 }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const request = persistProjectTasksToApi(
      'project-forma',
      [task],
      'https://api.example.test',
      2,
    )

    await expect(request).rejects.toBeInstanceOf(ProjectTaskApiConflictError)
    await expect(request).rejects.toMatchObject({
      expectedRevision: 2,
      actualRevision: 3,
    })
  })

  it('persists task mutations after the initial board sync', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ revision: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
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
