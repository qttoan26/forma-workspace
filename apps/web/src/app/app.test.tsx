import { render, screen } from '@testing-library/react'

import { HomePage } from '@/pages/home/home-page'

// The router owns route resolution. Keep this test focused on the rendered
// dashboard foundation so it stays deterministic in jsdom.
describe('HomePage', () => {
  it('renders the workspace dashboard and primary project entry point', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { name: /keep the work moving/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Open tasks')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /open project board/i }),
    ).toHaveAttribute('href', '/workspaces/forma/projects/project-1')
    expect(
      screen.getByRole('heading', { name: /product launch/i }),
    ).toBeInTheDocument()
  })
})
