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
  beforeEach(() => {
    window.localStorage.clear()
  })

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

  it('creates and edits a task with a description', async () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    fireEvent.click(screen.getByRole('button', { name: 'New task' }))
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Prepare release notes' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Coordinate launch details' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByText('Prepare release notes')).toBeInTheDocument()
    expect(screen.getByText('Coordinate launch details')).toBeInTheDocument()

    const createdCard = screen
      .getByText('Prepare release notes')
      .closest('article')
    expect(createdCard).not.toBeNull()
    fireEvent.click(
      within(createdCard as HTMLElement).getByRole('button', { name: 'Edit' }),
    )

    const title = screen.getByLabelText('Title')
    fireEvent.change(title, { target: { value: 'Publish release notes' } })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Publish to customer channels' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(screen.getByText('Publish release notes')).toBeInTheDocument(),
    )
    expect(screen.getByText('Publish to customer channels')).toBeInTheDocument()
    expect(screen.queryByText('Coordinate launch details')).not.toBeInTheDocument()
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
  it('shows an empty state when no tasks match the search', () => {
    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: 'no-such-task' }}
      />,
    )

    expect(screen.getAllByText('No matching tasks')).toHaveLength(4)
    expect(
      screen.queryByText('Build accessible task cards'),
    ).not.toBeInTheDocument()
  })
  it('announces the visible task count when search matches nothing', () => {
    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: 'no-such-task' }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      `0 of ${initialTasks.length} tasks shown`,
    )
  })
  it('suggests clearing filters when no tasks match', () => {
    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{ query: 'no-such-task' }}
      />,
    )

    expect(screen.getByRole('note')).toHaveTextContent(
      'Try clearing filters or using a different search term.',
    )
  })
  it('restores moved tasks after remounting the board', () => {
    const { unmount } = render(
      <TaskBoard initialTasks={initialTasks} members={members} />,
    )

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()
    fireEvent.change(within(task as HTMLElement).getByRole('combobox'), {
      target: { value: 'done' },
    })
    unmount()

    render(<TaskBoard initialTasks={initialTasks} members={members} />)
    const done = screen
      .getByRole('heading', { name: 'Done' })
      .closest('section')
    expect(done).not.toBeNull()
    expect(
      within(done as HTMLElement).getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('falls back to seed tasks when stored data is invalid', () => {
    window.localStorage.setItem('forma:tasks:v1:project-1', '{invalid')

    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })
  it('rejects stored tasks belonging to another project', () => {
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([{ ...initialTasks[0], projectId: 'another-project' }]),
    )

    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('rejects stored tasks with invalid workflow status', () => {
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([{ ...initialTasks[0], status: 'invalid' }]),
    )

    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })
})
