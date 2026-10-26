import { fireEvent, render, screen, within } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard task deletion', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deletes a task after confirmation and persists the deletion', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { unmount } = render(
      <TaskBoard initialTasks={initialTasks} members={members} />,
    )

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', { name: 'Delete' }),
    )

    expect(confirm).toHaveBeenCalledWith(
      'Delete "Create board interaction model"? This cannot be undone.',
    )
    expect(
      screen.queryByText('Create board interaction model'),
    ).not.toBeInTheDocument()

    unmount()
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.queryByText('Create board interaction model'),
    ).not.toBeInTheDocument()
  })

  it('keeps a task when deletion is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', { name: 'Delete' }),
    )

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('closes the edit form when the edited task is deleted', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', { name: 'Edit' }),
    )
    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', { name: 'Delete' }),
    )

    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument()
  })
})
