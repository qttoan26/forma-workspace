import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'

import { router } from '@/app/router'

describe('RouterErrorBoundary', () => {
  it('renders the global fallback for unexpected route failures', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/workspaces/forma/projects/project-1'],
    })

    const originalInvalidate = router.invalidate
    router.update({ history })
    router.invalidate = async () => {
      throw new Error('route reload failed')
    }

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: /something went wrong/i }),
    ).toBeInTheDocument()

    router.invalidate = originalInvalidate
  })
})
