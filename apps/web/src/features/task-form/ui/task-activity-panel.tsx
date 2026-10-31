import { useEffect, useState } from 'react'

import {
  appendTaskActivityToIndexedDb,
  loadTaskActivityFromIndexedDb,
} from '@/entities/task/lib/task-indexed-db'
import {
  createTaskActivityEntry,
  type TaskActivityEntry,
} from '@/entities/task/model/task-activity'
import { Button } from '@/shared/ui'

import './task-activity-panel.css'

interface TaskActivityPanelProps {
  projectId: string
  taskId: string
}

type ActivityStatus = 'loading' | 'ready' | 'error'

export function TaskActivityPanel({
  projectId,
  taskId,
}: TaskActivityPanelProps) {
  const [entries, setEntries] = useState<TaskActivityEntry[]>([])
  const [status, setStatus] = useState<ActivityStatus>('loading')
  const [comment, setComment] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void loadTaskActivityFromIndexedDb(projectId, taskId)
      .then((storedEntries) => {
        if (cancelled) return
        setEntries(storedEntries)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [projectId, taskId])

  async function addComment() {
    const body = comment.trim()
    if (!body) return

    const entry = createTaskActivityEntry({
      projectId,
      taskId,
      kind: 'comment',
      body,
      authorLabel: 'You',
    })

    setComment('')
    setSaveError(null)
    setSaveStatus(null)
    setEntries((current) => [...current, entry])

    try {
      const storedEntries = await appendTaskActivityToIndexedDb(
        projectId,
        taskId,
        entry,
      )
      setEntries(storedEntries)
      setSaveStatus('Comment saved locally.')
    } catch {
      setSaveError(
        'Comment is visible in this session but could not be saved locally.',
      )
    }
  }

  return (
    <section className="task-activity-panel" aria-label="Task activity">
      <div className="task-activity-composer">
        <label htmlFor={`task-comment-${taskId}`}>Add comment</label>
        <textarea
          id={`task-comment-${taskId}`}
          rows={3}
          maxLength={4000}
          placeholder="Share an update with the team"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          onKeyDown={(event) => {
            if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return
            event.preventDefault()
            void addComment()
          }}
        />
        <div className="task-activity-composer-actions">
          <span>Ctrl/⌘ + Enter to post</span>
          <Button
            variant="primary"
            type="button"
            disabled={!comment.trim()}
            onClick={() => void addComment()}
          >
            Comment
          </Button>
        </div>
        {saveStatus ? <p role="status">{saveStatus}</p> : null}
        {saveError ? <p role="alert">{saveError}</p> : null}
      </div>

      <div className="task-activity-feed" aria-live="polite">
        <div className="task-activity-feed-heading">
          <h3>Activity</h3>
          <span>{entries.length}</span>
        </div>

        {status === 'loading' ? <p>Loading activity…</p> : null}
        {status === 'error' ? (
          <p role="alert">Activity could not be loaded from local storage.</p>
        ) : null}
        {status === 'ready' && entries.length === 0 ? (
          <div className="task-activity-empty">
            <strong>No activity yet</strong>
            <span>Comments and task detail changes will appear here.</span>
          </div>
        ) : null}

        {entries.length > 0 ? (
          <ol className="task-activity-list">
            {entries.map((entry) => (
              <li key={entry.id} className={`is-${entry.kind}`}>
                <div className="task-activity-marker" aria-hidden="true">
                  {entry.kind === 'comment' ? 'Y' : '•'}
                </div>
                <div className="task-activity-entry">
                  <div className="task-activity-entry-meta">
                    <strong>
                      {entry.authorLabel ??
                        (entry.kind === 'comment' ? 'Teammate' : 'Task update')}
                    </strong>
                    <time dateTime={entry.createdAt}>
                      {formatActivityTimestamp(entry.createdAt)}
                    </time>
                  </div>
                  <p>{entry.body}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  )
}

function formatActivityTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
