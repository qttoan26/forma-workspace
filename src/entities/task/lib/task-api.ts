import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import {
  assertFrontendAuthStorageScope,
  getFrontendAccessToken,
  getFrontendAuthStorageScope,
} from '@/shared/lib/auth-session'

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

export class ProjectTaskApiUnauthorizedError extends Error {
  constructor() {
    super('Project task API authentication is required')
    this.name = 'ProjectTaskApiUnauthorizedError'
  }
}

export function getTaskApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
}

export async function loadProjectTasksFromApi(
  projectId: string,
  baseUrl = getTaskApiBaseUrl(),
): Promise<ProjectTaskApiSnapshot> {
  const authScope = getFrontendAuthStorageScope()
  const token = await getFrontendAccessToken()
  assertFrontendAuthStorageScope(authScope)

  const url = `${baseUrl}/api/projects/${projectId}/tasks`
  const response = token
    ? await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    : await fetch(url)
  assertFrontendAuthStorageScope(authScope)

  if (response.status === 401) {
    throw new ProjectTaskApiUnauthorizedError()
  }

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
  const authScope = getFrontendAuthStorageScope()
  const token = await getFrontendAccessToken()
  assertFrontendAuthStorageScope(authScope)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ tasks, expectedRevision }),
  })
  assertFrontendAuthStorageScope(authScope)

  if (response.status === 401) {
    throw new ProjectTaskApiUnauthorizedError()
  }

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
