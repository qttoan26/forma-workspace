import { useMemo, useState } from 'react'

import {
  loadTaskChecklist,
  saveTaskChecklist,
} from '@/entities/task/lib/task-checklist-storage'
import { appendTaskActivityToIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { createTaskActivityEntry } from '@/entities/task/model/task-activity'
import {
  createTaskChecklistItem,
  type TaskChecklistItem,
} from '@/entities/task/model/task-checklist'
import { Button } from '@/shared/ui'

import './task-checklist-panel.css'

interface TaskChecklistPanelProps {
  projectId: string
  taskId: string
}

export function TaskChecklistPanel({
  projectId,
  taskId,
}: TaskChecklistPanelProps) {
  const [items, setItems] = useState<TaskChecklistItem[]>(() =>
    loadTaskChecklist(projectId, taskId),
  )
  const [title, setTitle] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items],
  )

  function commit(nextItems: TaskChecklistItem[]) {
    setItems(nextItems)
    setSaveError(null)

    try {
      saveTaskChecklist(projectId, taskId, nextItems)
    } catch {
      setSaveError(
        'Checklist changed in this session but could not be saved locally.',
      )
    }
  }

  function recordActivity(body: string) {
    const entry = createTaskActivityEntry({
      projectId,
      taskId,
      kind: 'event',
      body,
      authorLabel: 'You',
    })

    void appendTaskActivityToIndexedDb(projectId, taskId, entry).catch(
      () => undefined,
    )
  }

  function addItem() {
    const nextTitle = title.trim()
    if (!nextTitle) return

    const item = createTaskChecklistItem({
      projectId,
      taskId,
      title: nextTitle,
    })
    commit([...items, item])
    setTitle('')
    recordActivity(`Added checklist item “${nextTitle}”.`)
  }

  function toggleItem(item: TaskChecklistItem) {
    const completed = !item.completed
    const updatedAt = new Date().toISOString()
    commit(
      items.map((candidate) =>
        candidate.id === item.id
          ? { ...candidate, completed, updatedAt }
          : candidate,
      ),
    )
    recordActivity(
      `${completed ? 'Completed' : 'Reopened'} checklist item “${item.title}”.`,
    )
  }

  function removeItem(item: TaskChecklistItem) {
    commit(items.filter((candidate) => candidate.id !== item.id))
    recordActivity(`Removed checklist item “${item.title}”.`)
  }

  return (
    <section className="task-checklist-panel" aria-label="Task checklist">
      <div className="task-checklist-heading">
        <div>
          <p className="eyebrow">Execution</p>
          <h3>Checklist</h3>
        </div>
        <span aria-label={`${completedCount} of ${items.length} completed`}>
          {completedCount}/{items.length}
        </span>
      </div>

      <div className="task-checklist-progress" aria-hidden="true">
        <span
          style={{
            width:
              items.length === 0
                ? '0%'
                : `${Math.round((completedCount / items.length) * 100)}%`,
          }}
        />
      </div>

      <div className="task-checklist-composer">
        <label htmlFor={`task-checklist-title-${taskId}`}>Add item</label>
        <div>
          <input
            id={`task-checklist-title-${taskId}`}
            value={title}
            maxLength={500}
            placeholder="Add a concrete next step"
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              addItem()
            }}
          />
          <Button
            variant="primary"
            type="button"
            disabled={!title.trim()}
            onClick={addItem}
          >
            Add
          </Button>
        </div>
      </div>

      {saveError ? <p role="alert">{saveError}</p> : null}

      {items.length === 0 ? (
        <div className="task-checklist-empty">
          <strong>No checklist items yet</strong>
          <span>Break the task into small, verifiable steps.</span>
        </div>
      ) : (
        <ul className="task-checklist-list">
          {items.map((item) => (
            <li key={item.id} className={item.completed ? 'is-complete' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item)}
                />
                <span>{item.title}</span>
              </label>
              <button
                type="button"
                className="task-checklist-remove"
                aria-label={`Remove ${item.title}`}
                onClick={() => removeItem(item)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
