import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import type { TaskChecklistItem } from '@/entities/task/model/task-checklist'

import { TaskChecklistPanel } from './task-checklist-panel'

const mocks = vi.hoisted(() => ({
  loadTaskChecklist: vi.fn(),
  saveTaskChecklist: vi.fn(),
  appendTaskActivityToIndexedDb: vi.fn(),
}))

vi.mock('@/entities/task/lib/task-checklist-storage', () => ({
  loadTaskChecklist: mocks.loadTaskChecklist,
  saveTaskChecklist: mocks.saveTaskChecklist,
}))

vi.mock('@/entities/task/lib/task-indexed-db', () => ({
  appendTaskActivityToIndexedDb: mocks.appendTaskActivityToIndexedDb,
}))

describe('TaskChecklistPanel', () => {
  it('adds and completes a checklist item with local persistence', async () => {
    mocks.loadTaskChecklist.mockReturnValue([])
    mocks.saveTaskChecklist.mockImplementation(() => undefined)
    mocks.appendTaskActivityToIndexedDb.mockResolvedValue([])

    render(<TaskChecklistPanel projectId="project-1" taskId="FOR-18" />)

    fireEvent.change(screen.getByLabelText('Add item'), {
      target: { value: 'Confirm acceptance criteria' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Confirm acceptance criteria')).toBeVisible()
    expect(screen.getByLabelText('0 of 1 completed')).toBeVisible()

    const firstSave = mocks.saveTaskChecklist.mock.calls[0]?.[2] as
      | TaskChecklistItem[]
      | undefined
    expect(firstSave).toEqual([
      expect.objectContaining({
        projectId: 'project-1',
        taskId: 'FOR-18',
        title: 'Confirm acceptance criteria',
        completed: false,
      }),
    ])

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Confirm acceptance criteria' }),
    )

    expect(screen.getByLabelText('1 of 1 completed')).toBeVisible()
    await waitFor(() =>
      expect(mocks.appendTaskActivityToIndexedDb).toHaveBeenCalledWith(
        'project-1',
        'FOR-18',
        expect.objectContaining({
          kind: 'event',
          body: 'Completed checklist item “Confirm acceptance criteria”.',
        }),
      ),
    )
  })
})
