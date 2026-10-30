import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

import {
  clearMemoryProjectTaskSync,
  enqueueMemoryProjectTaskSync,
} from '@/entities/task/lib/task-memory-sync-queue'
import { enqueueSessionProjectTaskSync } from '@/entities/task/lib/task-session-sync-queue'
import {
  clearProjectTaskSyncPending,
  markProjectTaskSyncPending,
  recordProjectTaskSyncFailure,
  recordProjectTaskSyncSuccess,
} from '@/entities/task/lib/task-sync-storage'
import type { Task } from '@/entities/task/model/task'

import { ProjectBoardSyncStatus } from './project-board-sync-status'

const { retryConfiguredProjectTaskSync } = vi.hoisted(() => ({
  retryConfiguredProjectTaskSync: vi.fn<
    (projectId: string) => Promise<void>
  >(),
}))

vi.mock('@/entities/task/lib/task-api', () => ({
  getTaskApiBaseUrl: () => 'https://example.test',
}))

vi.mock('@/entities/task/lib/task-persistence', () => ({
  retryConfiguredProjectTaskSync,
}))

const projectId = 'project-1'
const tasks: Task[] = [
  {
    id: 'task-1',
    projectId,
    title: 'Task',
    status: 'todo',
    priority: 'medium',
  },
]

afterEach(() => {
  sessionStorage.clear()
  clearMemoryProjectTaskSync(projectId)
  clearProjectTaskSyncPending(projectId)
  retryConfiguredProjectTaskSync.mockReset()
})

describe('ProjectBoardSyncStatus recovery states', () => {
  it('shows session recovery while a session-backed mutation is pending', async () => {
    enqueueSessionProjectTaskSync(projectId, tasks)
    markProjectTaskSyncPending(projectId)

    render(<ProjectBoardSyncStatus projectId={projectId} />)

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Recovered · waiting to sync',
    )
  })

  it('shows memory-only risk while a mutation exists only in memory', async () => {
    enqueueMemoryProjectTaskSync(projectId, tasks)
    markProjectTaskSyncPending(projectId)

    render(<ProjectBoardSyncStatus projectId={projectId} />)

    expect(await screen.findByRole('status')).toHaveTextContent('Memory only')
  })

  it('reacts when a pending mutation falls back to memory', async () => {
    render(<ProjectBoardSyncStatus projectId={projectId} />)

    act(() => {
      enqueueMemoryProjectTaskSync(projectId, tasks)
      markProjectTaskSyncPending(projectId)
    })

    expect(await screen.findByRole('status')).toHaveTextContent('Memory only')
  })

  it('shows a sync failure while unsynced changes remain queued', async () => {
    markProjectTaskSyncPending(projectId)
    recordProjectTaskSyncFailure(projectId)

    render(<ProjectBoardSyncStatus projectId={projectId} />)

    expect(await screen.findByRole('status')).toHaveTextContent('Sync failed')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  })

  it('clears the failure state after sync succeeds', async () => {
    markProjectTaskSyncPending(projectId)
    recordProjectTaskSyncFailure(projectId)
    render(<ProjectBoardSyncStatus projectId={projectId} />)

    expect(await screen.findByRole('status')).toHaveTextContent('Sync failed')

    act(() => {
      recordProjectTaskSyncSuccess(projectId)
    })

    expect(await screen.findByRole('status')).toHaveTextContent('Synced')
  })

  it('retries the queued sync and disables duplicate retry clicks', async () => {
    let resolveRetry: (() => void) | undefined
    retryConfiguredProjectTaskSync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve
        }),
    )
    markProjectTaskSyncPending(projectId)
    recordProjectTaskSyncFailure(projectId)
    render(<ProjectBoardSyncStatus projectId={projectId} />)

    const retryButton = await screen.findByRole('button', { name: 'Retry' })
    fireEvent.click(retryButton)

    expect(retryConfiguredProjectTaskSync).toHaveBeenCalledTimes(1)
    expect(retryConfiguredProjectTaskSync).toHaveBeenCalledWith(projectId)
    expect(
      screen.getByRole('button', { name: 'Retrying…' }),
    ).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Retrying…' }))
    expect(retryConfiguredProjectTaskSync).toHaveBeenCalledTimes(1)

    await act(() => {
      resolveRetry?.()
      return Promise.resolve()
    })

    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  })
})
