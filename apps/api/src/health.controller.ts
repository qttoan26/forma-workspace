import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'

import { PublicRoute } from './auth/public-route.decorator'
import { MongoDatabaseService } from './database/mongo-database.service'

@PublicRoute()
@Controller('health')
export class HealthController {
  constructor(private readonly database: MongoDatabaseService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok' as const,
      persistence: this.database.isConfigured ? 'mongodb' : 'memory',
    }
  }

  @Get('ready')
  async getReadiness() {
    const isReady = await this.database.ping()
    if (!isReady) {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        persistence: 'mongodb',
      })
    }

    return {
      status: 'ready' as const,
      persistence: this.database.isConfigured ? 'mongodb' : 'memory',
    }
  }
}
