import { render, screen } from '@testing-library/react'

import { ProjectBoardLoading } from './project-board-loading'

describe('ProjectBoardLoading', () => {
  it('announces the pending project board load', () => {
    render(<ProjectBoardLoading />)

    expect(
      screen.getByRole('heading', { name: /loading project board/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading the latest workspace, project, members, and tasks.',
    )
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
  })
})
