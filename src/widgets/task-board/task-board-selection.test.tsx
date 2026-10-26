import { fireEvent, render, screen, within } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

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

    expect(screen.getByLabelText('Title')).toHaveValue(
      'Create board interaction model',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

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
      within(task as HTMLElement).getByRole('button', { name: 'Edit' }),
    )

    expect(onSelectedTaskChange).toHaveBeenCalledWith('FOR-18')
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
  })
})
