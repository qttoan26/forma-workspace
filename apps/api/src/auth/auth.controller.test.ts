import { AuthController } from './auth.controller'

describe('AuthController', () => {
  it('returns the authenticated user', () => {
    expect(new AuthController().getCurrentUser({ id: 'user-123' })).toEqual({
      user: { id: 'user-123' },
    })
  })
})
