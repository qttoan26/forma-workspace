import 'reflect-metadata'

import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { getCorsOrigins } from './http/cors'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001)
}

void bootstrap()
