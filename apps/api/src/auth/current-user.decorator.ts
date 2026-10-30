import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import type { AuthenticatedRequest } from './auth.types'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (!request.user) {
      throw new UnauthorizedException('Authenticated user is unavailable')
    }

    return request.user
  },
)
