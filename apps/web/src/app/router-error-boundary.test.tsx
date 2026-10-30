import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { RouterErrorView } from '@/app/router-error-boundary'

describe('RouterErrorView', () => {
  it('renders an unexpected error and retries on request', () => {
    const onRetry = vi.fn()

    render(
      <RouterErrorView
        error={new Error('storage unavailable')}
        onRetry={onRetry}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /something went wrong/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('storage unavailable')

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('uses a safe message for non-error thrown values', () => {
    render(
      <RouterErrorView error={{ reason: 'bad state' }} onRetry={() => {}} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Unexpected error')
  })
})
