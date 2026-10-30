import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool, type PoolClient } from 'pg'

import type { TaskRecord } from './task.schema'
import {
  ProjectTaskRevisionConflictError,
  type TaskRepository,
} from './task.repository'

interface TaskRow {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskRecord['status']
  priority: TaskRecord['priority']
  assignee_id: string | null
  due_date: string | null
}

interface RevisionRow {
  revision: string
}

@Injectable()
export class PostgresTaskRepository implements TaskRepository, OnModuleDestroy {
  private readonly pool: Pool

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for PostgresTaskRepository')
    }

    this.pool = new Pool({ connectionString })
  }

  async replaceProjectTasks(
    projectId: string,
    tasks: TaskRecord[],
    expectedRevision?: number,
  ) {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO project_task_revisions (project_id, revision)
         VALUES ($1, 0)
         ON CONFLICT (project_id) DO NOTHING`,
        [projectId],
      )

      const revisionResult = await client.query<RevisionRow>(
        `SELECT revision
         FROM project_task_revisions
         WHERE project_id = $1
         FOR UPDATE`,
        [projectId],
      )
      const currentRevision = Number(revisionResult.rows[0]?.revision ?? 0)

      if (
        expectedRevision !== undefined &&
        expectedRevision !== currentRevision
      ) {
        throw new ProjectTaskRevisionConflictError(
          expectedRevision,
          currentRevision,
        )
      }

      await client.query('DELETE FROM tasks WHERE project_id = $1', [projectId])

      for (const task of tasks) {
        await this.insertTask(client, task)
      }

      const nextRevisionResult = await client.query<RevisionRow>(
        `UPDATE project_task_revisions
         SET revision = revision + 1
         WHERE project_id = $1
         RETURNING revision`,
        [projectId],
      )
      const nextRevision = Number(nextRevisionResult.rows[0]?.revision)

      await client.query('COMMIT')
      return nextRevision
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async getProjectTasks(projectId: string) {
    const [tasksResult, revisionResult] = await Promise.all([
      this.pool.query<TaskRow>(
        `SELECT id, project_id, title, description, status, priority, assignee_id, due_date
         FROM tasks
         WHERE project_id = $1
         ORDER BY id`,
        [projectId],
      ),
      this.pool.query<RevisionRow>(
        `SELECT revision
         FROM project_task_revisions
         WHERE project_id = $1`,
        [projectId],
      ),
    ])

    return {
      tasks: tasksResult.rows.map(toTaskRecord),
      revision: Number(revisionResult.rows[0]?.revision ?? 0),
    }
  }

  async onModuleDestroy() {
    await this.pool.end()
  }

  private async insertTask(client: PoolClient, task: TaskRecord) {
    await client.query(
      `INSERT INTO tasks (
        id, project_id, title, description, status, priority, assignee_id, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        task.id,
        task.projectId,
        task.title,
        task.description ?? null,
        task.status,
        task.priority,
        task.assigneeId ?? null,
        task.dueDate ?? null,
      ],
    )
  }
}

function toTaskRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    ...(row.description ? { description: row.description } : {}),
    ...(row.assignee_id ? { assigneeId: row.assignee_id } : {}),
    ...(row.due_date ? { dueDate: row.due_date } : {}),
  }
}
