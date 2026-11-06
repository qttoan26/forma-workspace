import { fireEvent, render, screen, within } from '@testing-library/react'

import { initialTasks, members } from '@/test/fixtures/project-board'

import { TaskBoard } from './task-board'

describe('TaskBoard external task selection', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens the task selected by navigation state and reports when it closes', () => {
    const onSelectedTaskChange = vi.fn()

    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        selectedTaskId="FOR-18"
        onSelectedTaskChange={onSelectedTaskChange}
      />,
    )

    const drawer = within(screen.getByRole('dialog', { name: 'Task details' }))
    expect(drawer.getByRole('heading')).toHaveTextContent(
      'Create board interaction model',
    )
    expect(drawer.queryByLabelText('Title')).not.toBeInTheDocument()

    fireEvent.click(drawer.getByRole('button', { name: 'Close' }))

    expect(onSelectedTaskChange).toHaveBeenCalledWith(null)
  })

  it('reports task selection without mutating controlled navigation state', () => {
    const onSelectedTaskChange = vi.fn()

    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        selectedTaskId={null}
        onSelectedTaskChange={onSelectedTaskChange}
      />,
    )

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', {
        name: 'View Create board interaction model',
      }),
    )

    expect(onSelectedTaskChange).toHaveBeenCalledWith('FOR-18')
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
  })

  it('offers a recovery action when a deep-linked task no longer exists', () => {
    const onSelectedTaskChange = vi.fn()

    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        selectedTaskId="FOR-404"
        onSelectedTaskChange={onSelectedTaskChange}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Task FOR-404 could not be found.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Return to board' }))

    expect(onSelectedTaskChange).toHaveBeenCalledWith(null)
  })
})
