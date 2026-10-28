import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard task ID accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds task ID context while preserving the visible identifier', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const taskId = screen.getByLabelText('Task ID: FOR-18')

    expect(taskId).toHaveTextContent('FOR-18')
  })
})
