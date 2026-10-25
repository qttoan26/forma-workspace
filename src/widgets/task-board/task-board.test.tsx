import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import {
  initialTasks,
  members,
} from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard', () => {
  it('moves a task between workflow columns', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()
    fireEvent.change(within(task as HTMLElement).getByRole('combobox'), {
      target: { value: 'in-progress' },
    })

    const inProgress = screen
      .getByRole('heading', { name: 'In Progress' })
      .closest('section')
    expect(inProgress).not.toBeNull()
    expect(
      within(inProgress as HTMLElement).getByText(
        'Create board interaction model',
      ),
    ).toBeInTheDocument()
  })

  it('creates and edits a task', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    fireEvent.click(screen.getByRole('button', { name: 'New task' }))
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Prepare release notes' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByText('Prepare release notes')).toBeInTheDocument()

    const createdCard = screen
      .getByText('Prepare release notes')
      .closest('article')
    expect(createdCard).not.toBeNull()
    fireEvent.click(
      within(createdCard as HTMLElement).getByRole('button', { name: 'Edit' }),
    )

    const title = screen.getByLabelText('Title')
    fireEvent.change(title, { target: { value: 'Publish release notes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(screen.getByText('Publish release notes')).toBeInTheDocument(),
    )
  })
})
