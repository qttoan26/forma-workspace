import { projectHref as hrefForProject } from '@/entities/project/lib/project-href'
import { useEffect, useRef, useState } from 'react'
import type { Task } from '@/entities/task/model/task'
import { taskStatusLabels } from '@/entities/task/model/task'
import {
  createTaskActivityEntry,
  type TaskActivityEntry,
} from '@/entities/task/model/task-activity'
import { appendTaskActivityToIndexedDb } from '@/entities/task/lib/task-indexed-db'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { inboxActor, type InboxItem } from './work-inbox-model'

export function InboxConversation({
  task,
  item,
  data,
  userId,
  entries,
  status,
  onRetry,
  onBack,
  draft,
  onDraftChange,
  onReplySaved,
}: {
  task: Task
  item: InboxItem
  data: ProjectBoardData
  userId: string | undefined
  entries: TaskActivityEntry[]
  status: 'loading' | 'ready' | 'error'
  onRetry: () => void
  onBack: () => void
  draft: string
  onDraftChange: (value: string) => void
  onReplySaved: (id: string) => void
}) {
  const projectHref = hrefForProject(data.workspace.slug, data.project.id)
  const heading = useRef<HTMLHeadingElement>(null)
  const sending = useRef(false)
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [conversationLimit, setConversationLimit] = useState(30)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const assignee = data.members.find((member) => member.id === task.assigneeId)
  const comments = entries
    .filter(
      (entry) =>
        entry.projectId === task.projectId &&
        entry.taskId === task.id &&
        entry.kind === 'comment',
    )
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    )

  async function reply() {
    const body = draft.trim()
    if (!body || body.length > 4000 || sending.current || status !== 'ready')
      return
    sending.current = true
    setSaveState('saving')
    try {
      const entry = createTaskActivityEntry({
        projectId: task.projectId,
        taskId: task.id,
        kind: 'comment',
        body,
        authorLabel: 'You',
        ...(userId ? { authorId: userId } : {}),
      })
      await appendTaskActivityToIndexedDb(task.projectId, task.id, entry)
      onReplySaved(entry.id)
      onDraftChange('')
      setSaveState('saved')
      onRetry()
    } catch {
      setSaveState('error')
    } finally {
      sending.current = false
    }
  }

  return (
    <>
      <div className="inbox-preview-toolbar">
        <button
          type="button"
          className="inbox-text-button"
          aria-label="Back to inbox"
          onClick={onBack}
        >
          ← Back
        </button>
        <span>{data.project.name}</span>
        <small>{task.id}</small>
        <a href={`${projectHref}?task=${encodeURIComponent(task.id)}`}>
          Open task ↗
        </a>
      </div>
      <ScrollRegion
        label="Inbox conversation"
        className="inbox-conversation-scroll"
      >
        <article className="inbox-conversation">
          <h2 ref={heading} tabIndex={-1}>
            {task.title}
          </h2>
          <dl className="inbox-task-meta">
            <div>
              <dt>Status</dt>
              <dd>{taskStatusLabels[task.status]}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{assignee?.name ?? 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd className={`inbox-priority-${task.priority}`}>
                {task.priority}
              </dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{task.dueDate ?? 'No due date'}</dd>
            </div>
          </dl>
          {task.description ? (
            <p className="inbox-description">{task.description}</p>
          ) : null}
          {item.category === 'assignment' || item.category === 'update' ? (
            <div className="inbox-selected-update">
              <small>
                {item.category === 'assignment'
                  ? 'Current assignment'
                  : 'Task update'}
              </small>
              <p>{item.snippet}</p>
            </div>
          ) : null}
          <h3>
            Conversation <span>{comments.length}</span>
          </h3>
          {status === 'error' ? (
            <p role="alert">
              Conversation could not be refreshed.{' '}
              <button
                type="button"
                className="inbox-text-button"
                onClick={onRetry}
              >
                Try again
              </button>
            </p>
          ) : null}
          {comments.length > conversationLimit ? (
            <button
              className="inbox-text-button"
              type="button"
              onClick={() => setConversationLimit((value) => value + 30)}
            >
              Show earlier comments
            </button>
          ) : null}
          {comments.length ? (
            <ol className="inbox-comments">
              {comments.slice(-conversationLimit).map((comment) => (
                <li key={comment.id}>
                  <span className="inbox-avatar" aria-hidden="true">
                    {inboxActor(comment, data, userId)
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div>
                    <div className="inbox-comment-meta">
                      <strong>{inboxActor(comment, data, userId)}</strong>
                      <time dateTime={comment.createdAt}>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(comment.createdAt))}
                      </time>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="inbox-conversation-hint">
              No comments yet. Start the conversation below.
            </p>
          )}
          <form
            className="inbox-reply"
            aria-label="Reply to task"
            onSubmit={(event) => {
              event.preventDefault()
              void reply()
            }}
          >
            <label htmlFor="inbox-reply">Reply</label>
            <textarea
              id="inbox-reply"
              rows={4}
              maxLength={4000}
              placeholder="Reply… use @Full Name to mention"
              value={draft}
              disabled={saveState === 'saving'}
              onChange={(event) => {
                onDraftChange(event.target.value)
                setSaveState('idle')
              }}
              onKeyDown={(event) => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  void reply()
                }
              }}
            />
            <div className="inbox-reply-actions">
              <small>Ctrl/⌘ + Enter to reply</small>
              <button
                type="submit"
                disabled={
                  !draft.trim() || saveState === 'saving' || status !== 'ready'
                }
              >
                {saveState === 'saving' ? 'Saving…' : 'Reply'}
              </button>
            </div>
            <p className="inbox-conversation-hint">
              Comments are saved on this browser.
            </p>
            {saveState === 'saved' ? (
              <p role="status">Reply saved locally.</p>
            ) : null}
            {saveState === 'error' ? (
              <p role="alert">
                Reply could not be saved. Your draft is kept here; try Reply
                again.
              </p>
            ) : null}
          </form>
        </article>
      </ScrollRegion>
    </>
  )
}
