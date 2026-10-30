import { act, render, screen } from '@testing-library/react'

import type { Task } from '@/entities/task/model/task'
import {
  clearMemoryProjectTaskSync,
  completeMemoryProjectTaskSync,
  enqueueMemoryProjectTaskSync,
} from '@/entities/task/lib/task-memory-sync-queue'

import { ProjectBoardMemoryRecovery } from './project-board-memory-recovery'

const projectId = 'project-1'
const task: Task = {
  id: 'task-1',
  projectId,
  title: 'Unsynced task',
  status: 'todo',
  priority: 'high',
}

afterEach(() => {
  clearMemoryProjectTaskSync(projectId)
})

describe('ProjectBoardMemoryRecovery', () => {
  it('stays hidden without a memory-only mutation', () => {
    render(<ProjectBoardMemoryRecovery projectId={projectId} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('warns while a memory-only mutation is pending and clears after sync', async () => {
    render(<ProjectBoardMemoryRecovery projectId={projectId} />)

    let queuedSync!: ReturnType<typeof enqueueMemoryProjectTaskSync>
    act(() => {
      queuedSync = enqueueMemoryProjectTaskSync(projectId, [task])
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unsynced changes are only protected in this open tab.',
    )

    act(() => {
      completeMemoryProjectTaskSync(projectId, queuedSync.mutationId)
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('blocks unload only while memory recovery is pending', () => {
    render(<ProjectBoardMemoryRecovery projectId={projectId} />)

    const safeUnload = new Event('beforeunload', { cancelable: true })
    expect(window.dispatchEvent(safeUnload)).toBe(true)
    expect(safeUnload.defaultPrevented).toBe(false)

    let queuedSync!: ReturnType<typeof enqueueMemoryProjectTaskSync>
    act(() => {
      queuedSync = enqueueMemoryProjectTaskSync(projectId, [task])
    })

    const protectedUnload = new Event('beforeunload', { cancelable: true })
    expect(window.dispatchEvent(protectedUnload)).toBe(false)
    expect(protectedUnload.defaultPrevented).toBe(true)

    act(() => {
      completeMemoryProjectTaskSync(projectId, queuedSync.mutationId)
    })

    const recoveredUnload = new Event('beforeunload', { cancelable: true })
    expect(window.dispatchEvent(recoveredUnload)).toBe(true)
    expect(recoveredUnload.defaultPrevented).toBe(false)
  })

  it('ignores memory recovery changes for another project', () => {
    render(<ProjectBoardMemoryRecovery projectId={projectId} />)

    act(() => {
      enqueueMemoryProjectTaskSync('project-2', [
        { ...task, id: 'task-2', projectId: 'project-2' },
      ])
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    clearMemoryProjectTaskSync('project-2')
  })
})
