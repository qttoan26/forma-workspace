import 'reflect-metadata'

import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { runDatabaseMigrations } from './database/run-migrations'

async function bootstrap() {
  await runDatabaseMigrations(process.env.DATABASE_URL)

  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001)
}

void bootstrap()
