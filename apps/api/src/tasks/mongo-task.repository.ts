import { Injectable, OnModuleDestroy } from '@nestjs/common'
import {
  MongoClient,
  MongoServerError,
  type Collection,
  type WithId,
} from 'mongodb'

import type { TaskRecord } from './task.schema'
import {
  ProjectTaskRevisionConflictError,
  type ProjectTaskSnapshot,
  type TaskRepository,
} from './task.repository'

interface ProjectTaskDocument {
  _id: string
  revision: number
  tasks: TaskRecord[]
}

@Injectable()
export class MongoTaskRepository implements TaskRepository, OnModuleDestroy {
  private readonly client: MongoClient
  private readonly collection: Collection<ProjectTaskDocument>

  constructor(
    connectionString = process.env.MONGODB_URI,
    databaseName = process.env.MONGODB_DB ?? 'forma_workspace',
  ) {
    if (!connectionString) {
      throw new Error('MONGODB_URI is required for MongoTaskRepository')
    }

    this.client = new MongoClient(connectionString)
    this.collection = this.client
      .db(databaseName)
      .collection<ProjectTaskDocument>('project_task_snapshots')
  }

  async replaceProjectTasks(
    projectId: string,
    tasks: TaskRecord[],
    expectedRevision?: number,
  ): Promise<number> {
    if (expectedRevision === undefined) {
      const snapshot = await this.collection.findOneAndUpdate(
        { _id: projectId },
        [
          {
            $set: {
              tasks,
              revision: {
                $add: [{ $ifNull: ['$revision', 0] }, 1],
              },
            },
          },
        ],
        { upsert: true, returnDocument: 'after' },
      )

      if (!snapshot) {
        throw new Error('MongoDB did not return the updated project task snapshot')
      }

      return snapshot.revision
    }

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: projectId, revision: expectedRevision },
        {
          $set: { tasks },
          $inc: { revision: 1 },
        },
        {
          upsert: expectedRevision === 0,
          returnDocument: 'after',
        },
      )

      if (result) return result.revision
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) {
        throw error
      }
    }

    const current = await this.collection.findOne(
      { _id: projectId },
      { projection: { revision: 1 } },
    )
    throw new ProjectTaskRevisionConflictError(
      expectedRevision,
      current?.revision ?? 0,
    )
  }

  async getProjectTasks(projectId: string): Promise<ProjectTaskSnapshot> {
    const snapshot = await this.collection.findOne({ _id: projectId })
    if (!snapshot) return { tasks: [], revision: 0 }

    return toProjectTaskSnapshot(snapshot)
  }

  async onModuleDestroy() {
    await this.client.close()
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
