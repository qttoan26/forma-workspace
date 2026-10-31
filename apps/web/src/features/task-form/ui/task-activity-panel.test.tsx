import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import type { TaskActivityEntry } from '@/entities/task/model/task-activity'

import { TaskActivityPanel } from './task-activity-panel'

const loadTaskActivityFromIndexedDb = vi.fn()
const appendTaskActivityToIndexedDb = vi.fn()

vi.mock('@/entities/task/lib/task-indexed-db', () => ({
  loadTaskActivityFromIndexedDb: (...args: unknown[]) =>
    loadTaskActivityFromIndexedDb(...args),
  appendTaskActivityToIndexedDb: (...args: unknown[]) =>
    appendTaskActivityToIndexedDb(...args),
}))

describe('TaskActivityPanel', () => {
  it('loads existing activity and persists a new comment', async () => {
    const existing: TaskActivityEntry = {
      id: 'activity-1',
      projectId: 'project-1',
      taskId: 'FOR-18',
      kind: 'event',
      body: 'Updated title.',
      createdAt: '2026-10-31T05:00:00.000Z',
      authorLabel: 'You',
    }
    loadTaskActivityFromIndexedDb.mockResolvedValue([existing])
    appendTaskActivityToIndexedDb.mockImplementation(
      async (_projectId, _taskId, entry: TaskActivityEntry) => [existing, entry],
    )

    render(<TaskActivityPanel projectId="project-1" taskId="FOR-18" />)

    expect(await screen.findByText('Updated title.')).toBeVisible()

    fireEvent.change(screen.getByLabelText('Add comment'), {
      target: { value: 'Ready for review' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }))

    expect(screen.getByText('Ready for review')).toBeVisible()
    await waitFor(() =>
      expect(appendTaskActivityToIndexedDb).toHaveBeenCalledWith(
        'project-1',
        'FOR-18',
        expect.objectContaining({
          kind: 'comment',
          body: 'Ready for review',
          authorLabel: 'You',
        }),
      ),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Comment saved locally.',
    )
  })
})
