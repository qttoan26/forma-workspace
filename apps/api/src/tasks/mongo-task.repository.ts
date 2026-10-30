import { Injectable } from '@nestjs/common'
import { MongoServerError, type Collection, type WithId } from 'mongodb'

import { MongoDatabaseService } from '../database/mongo-database.service'
import type { TaskRecord } from './task.schema'
import {
  ProjectTaskAccessDeniedError,
  ProjectTaskRevisionConflictError,
  type ProjectTaskSnapshot,
  type TaskRepository,
} from './task.repository'

interface ProjectTaskDocument {
  _id: string
  ownerId: string
  revision: number
  tasks: TaskRecord[]
}

@Injectable()
export class MongoTaskRepository implements TaskRepository {
  private readonly collection: Collection<ProjectTaskDocument>

  constructor(database: MongoDatabaseService) {
    this.collection = database.collection<ProjectTaskDocument>(
      'project_task_snapshots',
    )
  }

  async replaceProjectTasks(
    ownerId: string,
    projectId: string,
    tasks: TaskRecord[],
    expectedRevision?: number,
  ): Promise<number> {
    const filter =
      expectedRevision === undefined
        ? { _id: projectId, ownerId }
        : { _id: projectId, ownerId, revision: expectedRevision }

    try {
      const snapshot = await this.collection.findOneAndUpdate(
        filter,
        {
          $set: { tasks },
          $inc: { revision: 1 },
          $setOnInsert: { ownerId },
        },
        {
          upsert: expectedRevision === undefined || expectedRevision === 0,
          returnDocument: 'after',
        },
      )

      if (snapshot) return snapshot.revision
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) {
        throw error
      }
    }

    return this.throwWriteFailure(ownerId, projectId, expectedRevision)
  }

  async getProjectTasks(
    ownerId: string,
    projectId: string,
  ): Promise<ProjectTaskSnapshot> {
    const snapshot = await this.collection.findOne({ _id: projectId, ownerId })
    if (!snapshot) return { tasks: [], revision: 0 }

    return toProjectTaskSnapshot(snapshot)
  }

  private async throwWriteFailure(
    ownerId: string,
    projectId: string,
    expectedRevision?: number,
  ): Promise<never> {
    const current = await this.collection.findOne(
      { _id: projectId },
      { projection: { ownerId: 1, revision: 1 } },
    )

    if (current && current.ownerId !== ownerId) {
      throw new ProjectTaskAccessDeniedError(projectId)
    }

    if (expectedRevision !== undefined) {
      throw new ProjectTaskRevisionConflictError(
        expectedRevision,
        current?.revision ?? 0,
      )
    }

    throw new Error('MongoDB did not return the updated project task snapshot')
  }
}

function toProjectTaskSnapshot(
  document: WithId<ProjectTaskDocument>,
): ProjectTaskSnapshot {
  return {
    tasks: document.tasks,
    revision: document.revision,
  }
}
