import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { members } from '@/pages/project-board/project-board-data'

import { TaskForm } from './task-form'

describe('TaskForm', () => {
  it('validates the title before creating a task', async () => {
    const onSubmit = vi.fn()

    render(
      <TaskForm members={members} onCancel={vi.fn()} onSubmit={onSubmit} />,
    )

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'A' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Title must be at least 3 characters',
    )
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Prepare release notes' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  })
})
