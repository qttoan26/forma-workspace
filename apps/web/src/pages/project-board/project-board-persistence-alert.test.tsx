import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { ProjectBoardPersistenceAlert } from './project-board-persistence-alert'

describe('ProjectBoardPersistenceAlert', () => {
  it('announces a persistence failure and can be dismissed', () => {
    const onDismiss = vi.fn()

    render(<ProjectBoardPersistenceAlert onDismiss={onDismiss} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Task changes could not be saved.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your latest changes may be lost after you refresh this page.',
    )

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
