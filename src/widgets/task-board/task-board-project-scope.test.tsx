import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { Task } from '@/entities/task/model/task'
import { members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard project scope', () => {
  it('uses the explicit project id when the board starts empty', async () => {
    const persist = vi
      .fn<(projectId: string, tasks: Task[]) => Promise<void>>()
      .mockResolvedValue(undefined)

    render(
      <TaskBoard
        projectId="empty-project"
        initialTasks={[]}
        members={members}
        mutationAdapter={{ persist }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'New task' }))
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'First empty-project task' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() =>
      expect(persist).toHaveBeenLastCalledWith(
        'empty-project',
        expect.arrayContaining([
          expect.objectContaining({
            projectId: 'empty-project',
            title: 'First empty-project task',
          }),
        ]),
      ),
    )
  })
})
