import type { ComponentProps } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { createBrowserTaskMutationAdapter } from '@/entities/task/lib/task-mutation-adapter'
import { loadProjectTasks } from '@/entities/task/lib/task-storage'
import { initialTasks, members } from '@/test/fixtures/project-board'

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

  it('deletes a task after confirmation and persists the deletion', () => {
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

    const dialog = screen.getByRole('alertdialog', { name: 'Delete task?' })
    expect(dialog).toHaveAccessibleDescription(/Create board interaction model/)
    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
    confirmDeletion()
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
    confirmDeletion()

    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
  })

  it('restores a deleted task with undo and persists the restoration', () => {
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

    confirmDeletion()

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
    const dialog = screen.getByRole('alertdialog', { name: 'Delete task?' })
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' })
    expect(cancel).toHaveFocus()
    fireEvent.click(cancel)
    expect(dialog).not.toBeInTheDocument()
    expect(deleteButton).toHaveFocus()

    expect(
      screen.getByText('Create board interaction model'),
    ).toBeInTheDocument()
  })

  it('closes the edit form when the edited task is deleted', () => {
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

    confirmDeletion()

    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument()
  })
})

function confirmDeletion() {
  const dialog = screen.getByRole('alertdialog', { name: 'Delete task?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete task' }))
}
