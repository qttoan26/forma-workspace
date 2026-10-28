import type { ComponentProps } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { createBrowserTaskMutationAdapter } from '@/entities/task/lib/task-mutation-adapter'
import { loadProjectTasks } from '@/entities/task/lib/task-storage'
import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard as BaseTaskBoard } from './task-board'

const browserMutationAdapter = createBrowserTaskMutationAdapter()

function TaskBoard(props: ComponentProps<typeof BaseTaskBoard>) {
  const projectId = props.projectId ?? props.initialTasks[0]?.projectId
  if (!projectId) throw new Error('Test TaskBoard requires a project id')

  return (
    <BaseTaskBoard
      {...props}
      initialTasks={loadProjectTasks(projectId, props.initialTasks)}
      mutationAdapter={browserMutationAdapter}
    />
  )
}

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
      within(task as HTMLElement).getByRole('button', {
        name: 'Delete Create board interaction model',
      }),
    )

    expect(confirm).toHaveBeenCalledWith(
      'Delete "Create board interaction model"?',
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

  it('moves focus to Undo after deleting a task', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    const deleteButton = within(task as HTMLElement).getByRole('button', {
      name: 'Delete Create board interaction model',
    })
    deleteButton.focus()
    fireEvent.click(deleteButton)

    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
  })

  it('restores a deleted task with undo and persists the restoration', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { unmount } = render(
      <TaskBoard initialTasks={initialTasks} members={members} />,
    )

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', {
        name: 'Delete Create board interaction model',
      }),
    )

    expect(
      screen.getByText('Deleted Create board interaction model.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Undo' }),
    ).not.toBeInTheDocument()

    unmount()
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('keeps a task when deletion is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', {
        name: 'Delete Create board interaction model',
      }),
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
      within(task as HTMLElement).getByRole('button', {
        name: 'Edit Create board interaction model',
      }),
    )
    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', {
        name: 'Delete Create board interaction model',
      }),
    )

    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument()
  })
})
