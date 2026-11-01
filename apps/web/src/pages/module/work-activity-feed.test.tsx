import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkActivityFeed } from './work-activity-feed'
import {
  initialTasks,
  members,
  project,
  workspace,
} from '@/pages/project-board/project-board-data'
import type { TaskActivityEntry } from '@/entities/task/model/task-activity'

const mocks = vi.hoisted(() => ({
  load: vi.fn<
    (projectId: string, taskIds: string[]) => Promise<TaskActivityEntry[]>
  >(),
  subscribe: vi.fn<(projectId: string, onChange: () => void) => () => void>(),
}))
const projectBoardData = { initialTasks, members, project, workspace }
vi.mock('@/entities/task/lib/task-indexed-db', () => ({
  loadProjectActivityFromIndexedDb: mocks.load,
}))
vi.mock('@/entities/task/lib/task-activity-events', () => ({
  subscribeTaskActivity: mocks.subscribe,
}))
const entry: TaskActivityEntry = {
  id: 'activity-1',
  projectId: 'project-1',
  taskId: 'FOR-18',
  kind: 'comment',
  body: 'Ready for review',
  createdAt: '2026-11-01T08:00:00Z',
  authorLabel: 'You',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.subscribe.mockReturnValue(vi.fn())
  mocks.load.mockResolvedValue([entry])
})
afterEach(cleanup)

describe('Saved project activity', () => {
  it('reads known project tasks and opens the original task with preserved body text', async () => {
    render(<WorkActivityFeed data={projectBoardData} />)
    expect(await screen.findByText('Ready for review')).toBeInTheDocument()
    expect(mocks.load).toHaveBeenCalledWith(
      'project-1',
      projectBoardData.initialTasks.map((task) => task.id),
    )
    expect(
      screen.getByRole('link', { name: 'Create board interaction model' }),
    ).toHaveAttribute(
      'href',
      '/workspaces/forma/projects/project-1?task=FOR-18',
    )
    fireEvent.change(screen.getByLabelText('Activity type'), {
      target: { value: 'event' },
    })
    expect(screen.getByText('No matching activity')).toBeInTheDocument()
  })
  it('shows an honest empty feed and retries unavailable storage', async () => {
    mocks.load
      .mockRejectedValueOnce(new Error('blocked'))
      .mockResolvedValueOnce([])
    render(<WorkActivityFeed data={projectBoardData} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not be loaded',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh activity' }))
    expect(await screen.findByText('No saved activity yet')).toBeInTheDocument()
    expect(screen.queryByText('Ready for review')).not.toBeInTheDocument()
  })
  it('reloads on committed activity and unsubscribes when leaving', async () => {
    const unsubscribe = vi.fn()
    mocks.subscribe.mockReturnValue(unsubscribe)
    const view = render(<WorkActivityFeed data={projectBoardData} />)
    await screen.findByText('Ready for review')
    mocks.load.mockResolvedValue([])
    mocks.subscribe.mock.calls[0]?.[1]?.()
    await waitFor(() =>
      expect(screen.getByText('No saved activity yet')).toBeInTheDocument(),
    )
    view.unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
