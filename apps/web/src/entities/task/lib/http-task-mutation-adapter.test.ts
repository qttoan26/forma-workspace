import {
  createHttpTaskMutationAdapter,
  TaskMutationHttpError,
} from './http-task-mutation-adapter'

import type { Task } from '../model/task'

const task: Task = {
  id: 'FOR-502',
  projectId: 'project/forma',
  title: 'Persist through HTTP adapter',
  status: 'in-progress',
  priority: 'medium',
}

describe('HTTP task mutation adapter', () => {
  it('persists the task collection through the project endpoint', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    )
    const adapter = createHttpTaskMutationAdapter({
      baseUrl: '/api/',
      fetchImpl,
    })

    await expect(
      adapter.persist(task.projectId, [task]),
    ).resolves.toBeUndefined()

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/projects/project%2Fforma/tasks',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ tasks: [task] }),
      },
    )
  })

  it('exposes HTTP failures to the mutation effect boundary', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    )
    const adapter = createHttpTaskMutationAdapter({ fetchImpl })

    await expect(adapter.persist(task.projectId, [task])).rejects.toEqual(
      new TaskMutationHttpError(503, 'Service Unavailable'),
    )
  })
})
