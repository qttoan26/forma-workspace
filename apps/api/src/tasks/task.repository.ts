import { Injectable } from '@nestjs/common'

import type { TaskRecord } from './task.schema'

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY')

export interface ProjectTaskSnapshot {
  tasks: TaskRecord[]
  revision: number
}

export class ProjectTaskRevisionConflictError extends Error {
  constructor(
    readonly expectedRevision: number,
    readonly actualRevision: number,
  ) {
    super(
      `Project task revision conflict: expected ${expectedRevision}, actual ${actualRevision}`,
    )
    this.name = 'ProjectTaskRevisionConflictError'
  }
}

export class ProjectTaskAccessDeniedError extends Error {
  constructor(readonly projectId: string) {
    super(`Project task access denied: ${projectId}`)
    this.name = 'ProjectTaskAccessDeniedError'
  }
}

export interface TaskRepository {
  replaceProjectTasks: (
    ownerId: string,
    projectId: string,
    tasks: TaskRecord[],
    expectedRevision?: number,
  ) => Promise<number>
  getProjectTasks: (
    ownerId: string,
    projectId: string,
  ) => Promise<ProjectTaskSnapshot>
}

@Injectable()
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasksByProject = new Map<string, TaskRecord[]>()
  private readonly revisionsByProject = new Map<string, number>()
  private readonly ownersByProject = new Map<string, string>()

  replaceProjectTasks(
    ownerId: string,
    projectId: string,
    tasks: TaskRecord[],
    expectedRevision?: number,
  ) {
    const currentOwner = this.ownersByProject.get(projectId)
    if (currentOwner && currentOwner !== ownerId) {
      return Promise.reject(new ProjectTaskAccessDeniedError(projectId))
    }

    const currentRevision = this.revisionsByProject.get(projectId) ?? 0
    if (
      expectedRevision !== undefined &&
      expectedRevision !== currentRevision
    ) {
      return Promise.reject(
        new ProjectTaskRevisionConflictError(expectedRevision, currentRevision),
      )
    }

    const nextRevision = currentRevision + 1
    this.ownersByProject.set(projectId, ownerId)
    this.tasksByProject.set(
      projectId,
      tasks.map((task) => ({ ...task })),
    )
    this.revisionsByProject.set(projectId, nextRevision)

    return Promise.resolve(nextRevision)
  }

  getProjectTasks(ownerId: string, projectId: string) {
    if (this.ownersByProject.get(projectId) !== ownerId) {
      return Promise.resolve({ tasks: [], revision: 0 })
    }

    return Promise.resolve({
      tasks:
        this.tasksByProject.get(projectId)?.map((task) => ({ ...task })) ?? [],
      revision: this.revisionsByProject.get(projectId) ?? 0,
    })
  }
}
