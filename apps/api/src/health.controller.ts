import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok' as const,
      persistence: process.env.DATABASE_URL ? 'postgresql' : 'memory',
    }
  }
}
