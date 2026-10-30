import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AuthService } from './auth.service'
import { AuthenticationGuard } from './authentication.guard'

function createContext(authorization?: string) {
  const request: {
    headers: { authorization?: string }
    user?: { id: string }
  } = { headers: {} }
  if (authorization) request.headers.authorization = authorization

  const handler = () => undefined
  class Controller {}

  const context = {
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext

  return { context, handler, Controller, request }
}

describe('AuthenticationGuard', () => {
  it('skips authentication for public routes', async () => {
    const reflector = new Reflector()
    const authService = {
      authenticate: vi.fn(),
    } as unknown as AuthService
    const guard = new AuthenticationGuard(reflector, authService)
    const { context, handler } = createContext()
    Reflect.defineMetadata('forma:is-public-route', true, handler)

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(authService.authenticate).not.toHaveBeenCalled()
  })

  it('attaches the authenticated user to protected requests', async () => {
    const reflector = new Reflector()
    const authService = {
      authenticate: vi.fn().mockResolvedValue({ id: 'user-1' }),
    } as unknown as AuthService
    const guard = new AuthenticationGuard(reflector, authService)
    const { context, request } = createContext('Bearer token')

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(authService.authenticate).toHaveBeenCalledWith('Bearer token')
    expect(request.user).toEqual({ id: 'user-1' })
  })
})
