import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { members } from '@/pages/project-board/project-board-data'

import { TaskForm } from './task-form'

describe('TaskForm', () => {
  it('validates the title and trims descriptions before creating a task', async () => {
    const onSubmit = vi.fn()

    render(
      <TaskForm members={members} onCancel={vi.fn()} onSubmit={onSubmit} />,
    )

    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, {
      target: { value: 'A' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Title must be at least 3 characters',
    )
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(titleInput, {
      target: { value: 'Prepare release notes' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '  Coordinate launch details  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Prepare release notes',
          description: 'Coordinate launch details',
        }),
        expect.anything(),
      ),
    )
  })

  it('rejects descriptions longer than 500 characters', async () => {
    const onSubmit = vi.fn()

    render(
      <TaskForm members={members} onCancel={vi.fn()} onSubmit={onSubmit} />,
    )

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Prepare release notes' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'x'.repeat(501) },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Description must be 500 characters or less',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cancels the form when Escape is pressed', () => {
    const onCancel = vi.fn()

    render(
      <TaskForm members={members} onCancel={onCancel} onSubmit={vi.fn()} />,
    )

    fireEvent.keyDown(screen.getByLabelText('Title'), { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
