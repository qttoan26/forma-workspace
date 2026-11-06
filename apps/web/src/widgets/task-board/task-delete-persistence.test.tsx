import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import type { Task } from '@/entities/task/model/task'
import { initialTasks, members } from '@/test/fixtures/project-board'

import { TaskBoard } from './task-board'

describe('TaskBoard deletion persistence contract', () => {
  it('persists the task collection without the confirmed deleted task', async () => {
    const persist = vi
      .fn<(projectId: string, tasks: Task[]) => Promise<void>>()
      .mockResolvedValue(undefined)

    render(
      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        mutationAdapter={{ persist }}
      />,
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
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete task' }))

    await waitFor(() => {
      const latestTasks = persist.mock.calls.at(-1)?.[1]
      expect(latestTasks).toHaveLength(initialTasks.length - 1)
      expect(latestTasks).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'FOR-18' })]),
      )
    })
  })
})
