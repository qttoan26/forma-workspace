import { render, screen } from '@testing-library/react'

import { HomePage } from '@/pages/home/home-page'

// The router owns route resolution. Keep this test focused on the route's
// rendered foundation so it stays deterministic in jsdom.
describe('HomePage', () => {
  it('renders the Forma Workspace foundation', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { name: /work, shaped around your team/i }),
    ).toBeInTheDocument()
  })
})
