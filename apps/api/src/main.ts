import 'reflect-metadata'

import { ShutdownSignal } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import {
  getApiPort,
  validateRuntimeConfiguration,
} from './config/runtime-config'
import { getCorsOrigins } from './http/cors'

async function bootstrap() {
  validateRuntimeConfiguration()

  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks([ShutdownSignal.SIGTERM, ShutdownSignal.SIGINT])
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
  app.setGlobalPrefix('api')
  await app.listen(getApiPort())
}

void bootstrap()
