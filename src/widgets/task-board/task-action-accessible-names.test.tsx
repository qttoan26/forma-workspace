import { render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard task action accessible names', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('names Edit and Delete actions with the task title', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.getByRole('button', {
        name: 'Edit Create board interaction model',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Delete Create board interaction model',
      }),
    ).toBeInTheDocument()
  })
})
