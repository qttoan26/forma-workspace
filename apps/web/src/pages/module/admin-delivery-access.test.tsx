import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { configureApiAccessTokenProvider } from '@/shared/api/api-auth'
import { AdminDeliveryAccess } from './admin-delivery-access'

vi.mock('@/shared/auth/auth-session', () => ({ isDemoMode: () => false }))

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('looks up the selected scope and requires a new lookup after a stale write', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  const reset = configureApiAccessTokenProvider(() => 'admin-token')
  const fetchAccess = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ deliveryRead: false, revision: 2 }))
    .mockResolvedValueOnce(Response.json({ deliveryRead: true, revision: 3 }))
    .mockResolvedValueOnce(new Response(null, { status: 409 }))
  vi.stubGlobal('fetch', fetchAccess)
  try {
    render(<AdminDeliveryAccess />)
    fireEvent.change(screen.getByLabelText('Workspace ID'), {
      target: { value: 'forma' },
    })
    fireEvent.change(screen.getByLabelText('Organization ID'), {
      target: { value: 'org/1' },
    })
    fireEvent.change(screen.getByLabelText('Audience'), {
      target: { value: 'vendor' },
    })
    fireEvent.change(screen.getByLabelText('Account ID'), {
      target: { value: 'subject' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Look up access' }))
    const grantButton = await screen.findByRole('button', {
      name: 'Grant access',
    })
    const url =
      'https://api.example.test/api/admin/workspaces/forma/organizations/org%2F1/vendor/memberships/subject/delivery-access'
    expect(fetchAccess).toHaveBeenNthCalledWith(
      1,
      url,
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token' },
      }),
    )
    fireEvent.click(grantButton)
    expect(
      await screen.findByText('Delivery access is granted.'),
    ).toBeInTheDocument()
    expect(fetchAccess).toHaveBeenNthCalledWith(
      2,
      url,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ deliveryRead: true, expectedRevision: 2 }),
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Revoke access' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Look it up again',
    )
    expect(screen.queryByRole('button', { name: 'Revoke access' })).toBeNull()
    expect(fetchAccess).toHaveBeenNthCalledWith(
      3,
      url,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ deliveryRead: false, expectedRevision: 3 }),
      }),
    )
  } finally {
    reset()
  }
})
