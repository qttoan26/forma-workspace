import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { Pool } from 'pg'

interface MigrationRow {
  name: string
}

export async function runDatabaseMigrations(connectionString?: string) {
  if (!connectionString) {
    return
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('forma-workspace:migrations'))",
    )
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const appliedResult = await client.query<MigrationRow>(
      'SELECT name FROM schema_migrations',
    )
    const appliedMigrations = new Set(
      appliedResult.rows.map((migration) => migration.name),
    )

    const migrationsDirectory = resolve(__dirname, '../../migrations')
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort()

    for (const fileName of migrationFiles) {
      if (appliedMigrations.has(fileName)) {
        continue
      }

      const sql = await readFile(resolve(migrationsDirectory, fileName), 'utf8')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        fileName,
      ])
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}
