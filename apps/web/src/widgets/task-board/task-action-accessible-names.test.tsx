import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/test/fixtures/project-board'

import { TaskBoard } from './task-board'

describe('TaskBoard task action accessible names', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('names View and Delete actions with the task title while preserving visible labels', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const viewButton = screen.getByRole('button', {
      name: 'View Create board interaction model',
    })
    const deleteButton = screen.getByRole('button', {
      name: 'Delete Create board interaction model',
    })

    expect(viewButton).toHaveTextContent('View')
    expect(deleteButton).toHaveTextContent('Delete')
  })
})
