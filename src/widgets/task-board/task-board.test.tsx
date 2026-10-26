import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

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

  it('filters visible tasks without mutating the task collection', () => {
    const { rerender } = render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ priority: 'urgent' }}
      />,
    )

    expect(screen.getByText('Build accessible task cards')).toBeInTheDocument()
    expect(
      screen.queryByText('Create board interaction model'),
    ).not.toBeInTheDocument()

    rerender(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('searches tasks by title or task id case-insensitively', () => {
    const { rerender } = render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: 'ACCESSIBLE' }}
      />,
    )

    expect(screen.getByText('Build accessible task cards')).toBeInTheDocument()
    expect(
      screen.queryByText('Create board interaction model'),
    ).not.toBeInTheDocument()

    rerender(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: 'for-18' }}
      />,
    )

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('combines text search, priority and assignee filters', () => {
    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: 'task', priority: 'urgent', assigneeId: 'member-2' }}
      />,
    )

    expect(screen.getByText('Build accessible task cards')).toBeInTheDocument()
    expect(
      screen.queryByText('Create board interaction model'),
    ).not.toBeInTheDocument()
  })

  it('ignores surrounding whitespace in case-insensitive search', () => {
    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: '  FOR-18  ' }}
      />,
    )

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })
})
