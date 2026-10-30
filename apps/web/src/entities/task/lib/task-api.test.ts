import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Task } from '@/entities/task/model/task'
import { configureApiAccessTokenProvider } from '@/shared/api/api-auth'

import {
  createApiTaskMutationAdapter,
  loadProjectTasksFromApi,
  persistProjectTasksToApi,
  ProjectTaskApiConflictError,
} from './task-api'

const task: Task = {
  id: 'FOR-501',
  projectId: 'project-forma',
  title: 'Persist API tasks',
  status: 'todo',
  priority: 'high',
}

let resetAccessTokenProvider: (() => void) | undefined

afterEach(() => {
  resetAccessTokenProvider?.()
  resetAccessTokenProvider = undefined
  vi.unstubAllGlobals()
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

  it('sends a configured bearer token on protected task requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tasks: [task], revision: 4 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    resetAccessTokenProvider = configureApiAccessTokenProvider(() =>
      Promise.resolve('session-access-token'),
    )

    await loadProjectTasksFromApi('project-forma', 'https://api.example.test')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/project-forma/tasks',
      {
        headers: { Authorization: 'Bearer session-access-token' },
      },
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

  it('sends the configured bearer token on task writes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ revision: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    resetAccessTokenProvider = configureApiAccessTokenProvider(
      () => 'session-access-token',
    )

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
          Authorization: 'Bearer session-access-token',
        },
        body: JSON.stringify({ tasks: [task], expectedRevision: 4 }),
      },
    )
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
