import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard assignee accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('exposes the full assignee name while preserving initials visually', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const assignee = screen.getByLabelText('Assignee: Sam Lee')

    expect(assignee).toHaveTextContent('SL')
    expect(assignee).toHaveAttribute('title', 'Sam Lee')
  })
})
