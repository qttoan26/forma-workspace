import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { MongoClient, type Collection, type Document } from 'mongodb'

@Injectable()
export class MongoDatabaseService implements OnModuleDestroy {
  private readonly client: MongoClient | null
  private readonly databaseName: string

  constructor(
    connectionString = process.env.MONGODB_URI,
    databaseName = process.env.MONGODB_DB ?? 'forma_workspace',
  ) {
    this.databaseName = databaseName
    this.client = connectionString
      ? new MongoClient(connectionString, { serverSelectionTimeoutMS: 5_000 })
      : null
  }

  get isConfigured() {
    return this.client !== null
  }

  collection<TSchema extends Document>(name: string): Collection<TSchema> {
    if (!this.client) {
      throw new Error('MONGODB_URI is required for MongoDB persistence')
    }

    return this.client.db(this.databaseName).collection<TSchema>(name)
  }

  async ping(): Promise<boolean> {
    if (!this.client) return true

    try {
      await this.client.db(this.databaseName).command({ ping: 1 })
      return true
    } catch {
      return false
    }
  }

  async onModuleDestroy() {
    await this.client?.close()
  }
}
