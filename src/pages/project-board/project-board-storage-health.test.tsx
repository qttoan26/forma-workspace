import { act, render, screen, waitFor } from '@testing-library/react'

import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

import { ProjectBoardStorageHealth } from './project-board-storage-health'

describe('ProjectBoardStorageHealth', () => {
  it('stays hidden while browser storage is healthy', () => {
    reportBrowserStorageSuccess('indexed-db')
    reportBrowserStorageSuccess('local-storage')
    reportBrowserStorageSuccess('session-storage')

    render(<ProjectBoardStorageHealth />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces unavailable storage and clears after recovery', async () => {
    reportBrowserStorageSuccess('indexed-db')
    reportBrowserStorageSuccess('local-storage')
    reportBrowserStorageSuccess('session-storage')

    render(<ProjectBoardStorageHealth />)

    act(() => {
      reportBrowserStorageFailure(
        'indexed-db',
        new DOMException('Blocked', 'SecurityError'),
      )
    })

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Local browser storage is unavailable.',
    )

    act(() => {
      reportBrowserStorageSuccess('indexed-db')
    })

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('uses limited-storage messaging for quota pressure', async () => {
    reportBrowserStorageSuccess('indexed-db')
    reportBrowserStorageSuccess('local-storage')
    reportBrowserStorageSuccess('session-storage')

    render(<ProjectBoardStorageHealth />)

    act(() => {
      reportBrowserStorageFailure(
        'local-storage',
        new DOMException('Full', 'QuotaExceededError'),
      )
    })

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Local browser storage is limited.',
    )
  })
})
