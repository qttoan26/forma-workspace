import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { initialTasks, members } from '@/test/fixtures/project-board'

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

  it('returns focus to New task after creating a task', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const newTaskButton = screen.getByRole('button', { name: 'New task' })
    newTaskButton.focus()
    fireEvent.click(newTaskButton)

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Document keyboard focus behavior' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() => expect(newTaskButton).toHaveFocus())
    expect(
      screen.getByText('Document keyboard focus behavior'),
    ).toBeInTheDocument()
  })

  it('returns to read-only details and restores focus after cancelling an edit', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    const viewButton = within(task as HTMLElement).getByRole('button', {
      name: 'View Create board interaction model',
    })
    viewButton.focus()
    fireEvent.click(viewButton)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    const titleInput = screen.getByLabelText('Title')
    expect(titleInput).toHaveFocus()

    fireEvent.change(titleInput, { target: { value: 'Unsaved task title' } })
    fireEvent.keyDown(titleInput, { key: 'Escape' })

    const details = within(screen.getByRole('dialog', { name: 'Task details' }))
    expect(details.getByRole('heading')).toHaveTextContent(
      'Create board interaction model',
    )
    expect(details.getByRole('button', { name: 'Edit' })).toHaveFocus()
    fireEvent.click(details.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(viewButton).toHaveFocus())
  })

  it('returns focus to the task View button after saving an edit', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    const viewButton = within(task as HTMLElement).getByRole('button', {
      name: 'View Create board interaction model',
    })
    viewButton.focus()
    fireEvent.click(viewButton)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Create accessible board interaction model' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(viewButton).toHaveFocus())
    expect(
      screen.getByText('Create accessible board interaction model'),
    ).toBeInTheDocument()
  })
})
