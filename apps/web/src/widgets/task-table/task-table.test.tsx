import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Task } from '@/entities/task/model/task'

import { TaskTable } from './task-table'

const tasks: Task[] = Array.from({ length: 27 }, (_, index) => ({
  id: `FOR-${index + 1}`,
  projectId: 'project-1',
  title: `Task ${String(index + 1).padStart(2, '0')}`,
  status: 'todo',
  priority: index === 0 ? 'urgent' : index === 1 ? 'high' : 'low',
  ...(index === 0
    ? {}
    : { dueDate: `2026-11-${String(index).padStart(2, '0')}` }),
}))

describe('TaskTable', () => {
  it('sorts titles with semantic headers and opens the correct task after sorting', () => {
    const onOpenTask = vi.fn()
    render(<TaskTable tasks={tasks} members={[]} onOpenTask={onOpenTask} />)
    const header = screen.getByRole('columnheader', { name: /Task/ })
    fireEvent.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    const firstRow = screen.getAllByRole('row')[1]!
    fireEvent.click(
      within(firstRow).getByRole('button', { name: 'Open Task 27' }),
    )
    expect(onOpenTask).toHaveBeenCalledWith('FOR-27')
  })

  it('sorts priority by severity and keeps undated tasks last in either direction', () => {
    render(
      <TaskTable tasks={tasks.slice(0, 3)} members={[]} onOpenTask={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Priority/ }))
    expect(
      within(screen.getAllByRole('row')[1]!).getByText('low'),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Priority/ }))
    expect(
      within(screen.getAllByRole('row')[1]!).getByText('urgent'),
    ).toBeVisible()
    const dueButton = screen.getByRole('button', { name: /Due/ })
    fireEvent.click(dueButton)
    expect(
      within(screen.getAllByRole('row')[3]!).getByText('No due date'),
    ).toBeVisible()
    fireEvent.click(dueButton)
    expect(
      within(screen.getAllByRole('row')[3]!).getByText('No due date'),
    ).toBeVisible()
  })

  it('paginates and resets the page when project filters reduce the result set', async () => {
    const onOpenTask = vi.fn()
    const { rerender } = render(
      <TaskTable tasks={tasks} members={[]} onOpenTask={onOpenTask} />,
    )
    expect(screen.getAllByRole('row')).toHaveLength(26)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    rerender(
      <TaskTable
        tasks={tasks.slice(0, 1)}
        members={[]}
        onOpenTask={onOpenTask}
      />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Open Task 01' }),
      ).toBeVisible(),
    )
    expect(screen.getByRole('status')).toHaveTextContent('1–1 of 1 tasks')
  })

  it('shows an empty state and disables pagination with no matching tasks', () => {
    render(<TaskTable tasks={[]} members={[]} onOpenTask={vi.fn()} />)
    expect(screen.getByText(/No matching tasks/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('0–0 of 0 tasks')
  })
})
