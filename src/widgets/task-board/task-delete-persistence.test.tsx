import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import type { Task } from '@/entities/task/model/task'
import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard deletion persistence contract', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('saves the task collection without the confirmed deleted task', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const save = vi.fn<(projectId: string, tasks: Task[]) => void>()
    const persistence = {
      load: () => initialTasks,
      save,
    }

    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        persistence={persistence}
      />,
    )

    const task = screen
      .getByText('Create board interaction model')
      .closest('article')
    expect(task).not.toBeNull()

    fireEvent.click(
      within(task as HTMLElement).getByRole('button', { name: 'Delete' }),
    )

    await waitFor(() => {
      const latestTasks = save.mock.calls.at(-1)?.[1]
      expect(latestTasks).toHaveLength(initialTasks.length - 1)
      expect(latestTasks).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'FOR-18' })]),
      )
    })
  })
})
