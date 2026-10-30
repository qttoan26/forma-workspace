import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import { getApiAuthorizationHeader } from '@/shared/api/api-auth'

import {
  createTaskMutationEffectBoundary,
  type TaskMutationAdapter,
  type TaskMutationFailureHandler,
} from './task-mutation-adapter'

export interface ProjectTaskApiSnapshot {
  tasks: Task[]
  revision: number
}

export class ProjectTaskApiConflictError extends Error {
  constructor(
    readonly expectedRevision: number | null,
    readonly actualRevision: number | null,
  ) {
    super('Project task sync conflict')
    this.name = 'ProjectTaskApiConflictError'
  }
}

export function getTaskApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
}

export async function loadProjectTasksFromApi(
  projectId: string,
  baseUrl = getTaskApiBaseUrl(),
): Promise<ProjectTaskApiSnapshot> {
  const url = `${baseUrl}/api/projects/${projectId}/tasks`
  const authorizationHeader = await getApiAuthorizationHeader()
  const response = authorizationHeader
    ? await fetch(url, { headers: authorizationHeader })
    : await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load project tasks (${response.status})`)
  }

  const body = (await response.json()) as {
    tasks?: unknown
    revision?: unknown
  }
  const revision = parseRevision(body.revision)

  return {
    tasks: taskCollectionSchema.parse(body.tasks),
    revision,
  }
}

export async function persistProjectTasksToApi(
  projectId: string,
  tasks: Task[],
  baseUrl = getTaskApiBaseUrl(),
  expectedRevision?: number,
): Promise<number> {
  const authorizationHeader = await getApiAuthorizationHeader()
  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeader,
    },
    body: JSON.stringify({ tasks, expectedRevision }),
  })

  if (response.status === 409) {
    const body = (await response.json().catch(() => null)) as {
      expectedRevision?: unknown
      actualRevision?: unknown
    } | null

    throw new ProjectTaskApiConflictError(
      parseOptionalRevision(body?.expectedRevision),
      parseOptionalRevision(body?.actualRevision),
    )
  }

  if (!response.ok) {
    throw new Error(`Failed to persist project tasks (${response.status})`)
  }

  const body = (await response.json()) as { revision?: unknown }
  return parseRevision(body.revision)
}

export function createApiTaskMutationAdapter(
  baseUrl = getTaskApiBaseUrl(),
  onFailure?: TaskMutationFailureHandler,
): TaskMutationAdapter {
  const apiAdapter: TaskMutationAdapter = {
    async persist(projectId: string, tasks: Task[]) {
      await persistProjectTasksToApi(projectId, tasks, baseUrl)
    },
  }

  return createTaskMutationEffectBoundary(apiAdapter, onFailure)
}

function parseRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error('Invalid project task revision')
  }
  return value
}

function parseOptionalRevision(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null
  }
  return value
}
