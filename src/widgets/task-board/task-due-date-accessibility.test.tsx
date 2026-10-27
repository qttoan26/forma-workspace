import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard due date accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds due date context while preserving the semantic time value', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const dueDate = screen.getByLabelText('Due date: 2026-10-29')

    expect(dueDate).toHaveTextContent('2026-10-29')
    expect(dueDate).toHaveAttribute('datetime', '2026-10-29')
  })
})
