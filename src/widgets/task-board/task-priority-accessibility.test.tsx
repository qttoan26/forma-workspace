import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard priority accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds priority context while preserving the visible priority value', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const priority = screen.getByLabelText('Priority: high')

    expect(priority).toHaveTextContent('high')
  })
})
