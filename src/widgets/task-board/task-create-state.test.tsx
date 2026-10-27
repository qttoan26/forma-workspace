import { fireEvent, render, screen } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard controlled task creation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('requests creation state changes without overriding the controlled value', () => {
    const onCreatingTaskChange = vi.fn()
    const { rerender } = render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        isCreatingTask={false}
        onCreatingTaskChange={onCreatingTaskChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'New task' }))

    expect(onCreatingTaskChange).toHaveBeenLastCalledWith(true)
    expect(
      screen.queryByRole('button', { name: 'Create task' }),
    ).not.toBeInTheDocument()

    rerender(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        isCreatingTask
        onCreatingTaskChange={onCreatingTaskChange}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Create task' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCreatingTaskChange).toHaveBeenLastCalledWith(false)
  })
})
