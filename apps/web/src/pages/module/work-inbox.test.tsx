import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkInbox } from './work-inbox'
import {
  initialTasks,
  members,
  project,
  workspace,
} from '@/test/fixtures/project-board'
import type { TaskActivityEntry } from '@/entities/task/model/task-activity'
import { inboxReadPrefix } from './work-inbox-model'

const mocks = vi.hoisted(() => ({
  load: vi.fn<
    (projectId: string, taskIds: string[]) => Promise<TaskActivityEntry[]>
  >(),
  append:
    vi.fn<
      (
        projectId: string,
        taskId: string,
        entry: TaskActivityEntry,
      ) => Promise<TaskActivityEntry[]>
    >(),
  subscribe: vi.fn<(projectId: string, onChange: () => void) => () => void>(),
}))
vi.mock('@/entities/task/lib/task-indexed-db', () => ({
  loadProjectActivityFromIndexedDb: mocks.load,
  appendTaskActivityToIndexedDb: mocks.append,
}))
vi.mock('@/entities/task/lib/task-activity-events', () => ({
  subscribeTaskActivity: mocks.subscribe,
}))
const data = { initialTasks, members, project, workspace }
const entries: TaskActivityEntry[] = [
  {
    id: 'mention',
    taskId: 'FOR-18',
    projectId: project.id,
    kind: 'comment',
    body: 'Please @Sam Lee, review the board.',
    createdAt: '2026-11-01T08:00:00Z',
    authorLabel: 'Alex Morgan',
  },
  {
    id: 'update',
    taskId: 'FOR-18',
    projectId: project.id,
    kind: 'event',
    body: 'Description updated.',
    createdAt: '2026-11-01T09:00:00Z',
    authorLabel: 'You',
  },
]

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  mocks.load.mockResolvedValue(entries)
  mocks.subscribe.mockReturnValue(vi.fn())
  mocks.append.mockImplementation(
    (_projectId: string, _taskId: string, entry: TaskActivityEntry) => {
      mocks.load.mockResolvedValue([...entries, entry])
      return Promise.resolve([...entries, entry])
    },
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function openMention() {
  await screen.findByRole('tab', { name: 'Mentions 1' })
  fireEvent.click(screen.getByRole('tab', { name: 'Mentions 1' }))
  fireEvent.click(
    within(
      screen.getByRole('region', { name: 'Inbox notifications' }),
    ).getByRole('button', { name: /Alex Morgan mentioned you/ }),
  )
  return screen.getByRole('region', { name: 'Inbox conversation' })
}

describe('Inbox triage and conversation', () => {
  it('returns focus to the notification without focusing search, or to the results when Unread removes it', async () => {
    render(<WorkInbox data={data} userId="member-2" />)
    await openMention()
    fireEvent.click(screen.getByRole('button', { name: 'Back to inbox' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Alex Morgan mentioned you/ }),
      ).toHaveFocus(),
    )
    expect(
      screen.getByRole('searchbox', { name: 'Search inbox' }),
    ).not.toHaveFocus()
    fireEvent.click(
      screen.getByRole('button', { name: /Alex Morgan mentioned you/ }),
    )
    fireEvent.click(screen.getByLabelText('Unread'))
    fireEvent.click(screen.getByRole('button', { name: 'Back to inbox' }))
    await waitFor(() => expect(screen.getByRole('tabpanel')).toHaveFocus())
    expect(
      screen.getByRole('searchbox', { name: 'Search inbox' }),
    ).not.toHaveFocus()
  })
  it('filters categories/search, preserves selection through Unread and persists read state after remount', async () => {
    const view = render(<WorkInbox data={data} userId="member-2" />)
    fireEvent.click(screen.getByLabelText('Unread'))
    const conversation = await openMention()
    expect(
      within(conversation).getByText('Please @Sam Lee, review the board.'),
    ).toBeInTheDocument()
    expect(screen.getByText('You’re all caught up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open task/ })).toHaveAttribute(
      'href',
      '/workspaces/forma/projects/project-1?task=FOR-18',
    )
    view.unmount()
    render(<WorkInbox data={data} userId="member-2" />)
    await screen.findByText('Description updated.')
    expect(screen.getByRole('tab', { name: 'Mentions' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Assignments/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search inbox' }), {
      target: { value: 'accessible' },
    })
    expect(screen.getByText('Build accessible task cards')).toBeInTheDocument()
    expect(
      screen.queryByText('Create board interaction model'),
    ).not.toBeInTheDocument()
  })
  it('keeps a failed reply draft, saves retry once to the original task and shares the conversation', async () => {
    mocks.append.mockRejectedValueOnce(new Error('quota'))
    render(<WorkInbox data={data} userId="member-2" />)
    await openMention()
    fireEvent.change(screen.getByLabelText('Reply'), {
      target: { value: '  Looks good <script>literal text</script>  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Reply could not be saved',
    )
    expect(screen.getByLabelText('Reply')).toHaveValue(
      '  Looks good <script>literal text</script>  ',
    )
    fireEvent.keyDown(screen.getByLabelText('Reply'), {
      key: 'Enter',
      ctrlKey: true,
    })
    expect(await screen.findByText('Reply saved locally.')).toBeInTheDocument()
    expect(mocks.append).toHaveBeenLastCalledWith(
      project.id,
      'FOR-18',
      expect.objectContaining({
        body: 'Looks good <script>literal text</script>',
        authorId: 'member-2',
        kind: 'comment',
      }),
    )
    expect(mocks.append).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText('Reply')).toHaveValue('')
    expect(
      await within(
        screen.getByRole('region', { name: 'Inbox conversation' }),
      ).findByText('Looks good <script>literal text</script>'),
    ).toBeInTheDocument()
    expect(document.querySelector('.inbox-comments script')).toBeNull()
  })
  it('retains drafts when switching tasks and prevents duplicate submissions while saving', async () => {
    let complete!: (entries: TaskActivityEntry[]) => void
    mocks.append.mockImplementationOnce(
      () =>
        new Promise<TaskActivityEntry[]>((resolve) => {
          complete = resolve
        }),
    )
    render(<WorkInbox data={data} userId="member-2" />)
    await openMention()
    fireEvent.change(screen.getByLabelText('Reply'), {
      target: { value: 'Draft for board' },
    })
    fireEvent.click(screen.getByRole('tab', { name: /Assignments/ }))
    fireEvent.click(
      screen.getByRole('button', {
        name: /Assigned to you Build accessible task cards/,
      }),
    )
    expect(screen.getByLabelText('Reply')).toHaveValue('')
    fireEvent.click(
      screen.getByRole('button', {
        name: /Assigned to you Create board interaction model/,
      }),
    )
    expect(screen.getByLabelText('Reply')).toHaveValue('Draft for board')
    fireEvent.keyDown(screen.getByLabelText('Reply'), {
      key: 'Enter',
      metaKey: true,
    })
    fireEvent.keyDown(screen.getByLabelText('Reply'), {
      key: 'Enter',
      metaKey: true,
    })
    expect(mocks.append).toHaveBeenCalledOnce()
    await act(async () => {
      complete(entries)
      await Promise.resolve()
    })
  })
  it('marks every category read even when search is active and handles cross-tab read changes', async () => {
    render(<WorkInbox data={data} userId="member-2" />)
    await screen.findByRole('tab', { name: 'All 4' })
    fireEvent.change(screen.getByLabelText('Search inbox'), {
      target: { value: 'no match' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mark all as read' }),
    ).toBeDisabled()
    const key =
      inboxReadPrefix(project.id, 'member-2') +
      encodeURIComponent('activity:mention')
    localStorage.setItem(key, 'unread')
    fireEvent(window, new StorageEvent('storage', { key }))
    expect(screen.getByRole('tab', { name: 'Mentions 1' })).toBeInTheDocument()
  })
  it('shows a recoverable loading error and reloads when saved activity changes', async () => {
    mocks.load.mockRejectedValueOnce(new Error('blocked')).mockResolvedValue([])
    const unsubscribe = vi.fn()
    mocks.subscribe.mockReturnValue(unsubscribe)
    const view = render(<WorkInbox data={data} userId={undefined} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not be loaded',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('No notifications yet')).toBeInTheDocument()
    mocks.load.mockResolvedValue(entries)
    await act(async () => {
      mocks.subscribe.mock.calls.at(-1)?.[1]()
      await Promise.resolve()
    })
    expect(await screen.findByText('Description updated.')).toBeInTheDocument()
    expect(screen.getByText(/Link your account/)).toBeInTheDocument()
    view.unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
  it('reports read persistence failures and supports keyboard category navigation', async () => {
    render(<WorkInbox data={data} userId="member-2" />)
    await screen.findByRole('tab', { name: 'All 4' })
    fireEvent.keyDown(screen.getByRole('tab', { name: 'All 4' }), {
      key: 'ArrowRight',
    })
    expect(screen.getByRole('tab', { name: 'Mentions 1' })).toHaveFocus()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Read status could not be saved',
    )
    expect(screen.getByRole('tab', { name: 'All 4' })).toBeInTheDocument()
  })
})
