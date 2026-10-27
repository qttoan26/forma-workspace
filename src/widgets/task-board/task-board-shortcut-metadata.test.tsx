import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard keyboard shortcut metadata', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('exposes the New task keyboard shortcut to assistive technology', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const newTaskButton = screen.getByRole('button', { name: 'New task' })

    expect(newTaskButton).toHaveAttribute('aria-keyshortcuts', 'N')
    expect(newTaskButton).toHaveAttribute('title', 'Press N to create a task')
  })
})
