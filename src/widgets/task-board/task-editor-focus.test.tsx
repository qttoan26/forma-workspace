import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard editor focus management', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns focus to New task after cancelling creation with Escape', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const newTaskButton = screen.getByRole('button', { name: 'New task' })
    newTaskButton.focus()
    fireEvent.click(newTaskButton)

    const titleInput = screen.getByLabelText('Title')
    expect(titleInput).toHaveFocus()

    fireEvent.keyDown(titleInput, { key: 'Escape' })

    await waitFor(() => expect(newTaskButton).toHaveFocus())
    expect(
      screen.queryByRole('button', { name: 'Create task' }),
    ).not.toBeInTheDocument()
  })

  it('returns focus to the task Edit button after cancelling an edit', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    const editButton = within(task as HTMLElement).getByRole('button', {
      name: 'Edit',
    })
    editButton.focus()
    fireEvent.click(editButton)

    const titleInput = screen.getByLabelText('Title')
    expect(titleInput).toHaveFocus()

    fireEvent.keyDown(titleInput, { key: 'Escape' })

    await waitFor(() => expect(editButton).toHaveFocus())
  })
})
