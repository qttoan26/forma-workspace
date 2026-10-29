import type { TaskMutationAdapter } from './task-mutation-adapter'

export interface HttpTaskMutationAdapterOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export class TaskMutationHttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
  ) {
    super(
      `Task persistence failed with ${status}${statusText ? ` ${statusText}` : ''}`,
    )
    this.name = 'TaskMutationHttpError'
  }
}

export function createHttpTaskMutationAdapter({
  baseUrl = '/api',
  fetchImpl = fetch,
}: HttpTaskMutationAdapterOptions = {}): TaskMutationAdapter {
  return {
    async persist(projectId, tasks) {
      const response = await fetchImpl(
        `${trimTrailingSlash(baseUrl)}/projects/${encodeURIComponent(projectId)}/tasks`,
        {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ tasks }),
        },
      )

      if (!response.ok) {
        throw new TaskMutationHttpError(response.status, response.statusText)
      }
    },
  }
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}
