import { useLayoutEffect, useRef, useState } from 'react'

import type { Member } from '@/entities/member/model/member'
import {
  getTaskDeadline,
  taskStatusLabels,
  type Task,
} from '@/entities/task/model/task'
import { TaskDeadlineBadge } from '@/entities/task/ui/task-deadline-badge'
import { localDateKey } from '@/shared/lib/local-date-key'
import { Button } from '@/shared/ui'

import { createTaskFormDraftKey } from '../lib/task-form-draft'
import type { TaskFormValues } from '../model/task-form-schema'
import { TaskActivityPanel } from './task-activity-panel'
import { TaskChecklistPanel } from './task-checklist-panel'
import { TaskEditorDrawer } from './task-editor-drawer'
import { TaskForm } from './task-form'
import { TaskLinkedFilesPanel } from './task-linked-files-panel'
import './task-details-drawer.css'

const sections = [
  { id: 'details', label: 'Details' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'files', label: 'Files' },
  { id: 'activity', label: 'Activity' },
] as const

export function TaskDetailsDrawer({
  task,
  members,
  onClose,
  onSubmit,
}: {
  task: Task
  members: Member[]
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
}) {
  const [editing, setEditing] = useState(false)
  const [activeSection, setActiveSection] =
    useState<(typeof sections)[number]['id']>('details')
  const editButton = useRef<HTMLButtonElement>(null)
  const restoreEditFocus = useRef(false)

  useLayoutEffect(() => {
    if (editing || !restoreEditFocus.current) return
    editButton.current?.focus()
    restoreEditFocus.current = false
  }, [editing])

  const assignee = members.find((member) => member.id === task.assigneeId)
  const deadline = getTaskDeadline(task)

  return (
    <TaskEditorDrawer
      open
      label={editing ? 'Edit task' : 'Task details'}
      onClose={onClose}
    >
      {editing ? (
        <TaskForm
          members={members}
          task={task}
          draftKey={createTaskFormDraftKey(task.projectId, task.id)}
          onCancel={() => {
            restoreEditFocus.current = true
            setEditing(false)
          }}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="task-form task-detail-view">
          <header className="task-form-heading">
            <div>
              <p className="eyebrow">{task.id}</p>
              <h2>{task.title}</h2>
            </div>
            <div className="task-detail-actions">
              <button
                ref={editButton}
                type="button"
                className="button-primary"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <Button type="button" data-modal-autofocus onClick={onClose}>
                Close
              </Button>
            </div>
          </header>

          <div
            className="task-detail-tabs"
            role="tablist"
            aria-label="Task details"
          >
            {sections.map(({ id, label }) => (
              <button
                key={id}
                id={`task-${id}-tab-${task.id}`}
                type="button"
                role="tab"
                aria-selected={activeSection === id}
                aria-controls={`task-${id}-panel-${task.id}`}
                onClick={() => setActiveSection(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeSection === 'details' ? (
            <div
              id={`task-details-panel-${task.id}`}
              className="task-detail-panel"
              role="tabpanel"
              aria-labelledby={`task-details-tab-${task.id}`}
            >
              <dl className="task-detail-fields">
                <div>
                  <dt>Status</dt>
                  <dd>{taskStatusLabels[task.status]}</dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd className="task-detail-priority">{task.priority}</dd>
                </div>
                <div>
                  <dt>Assignee</dt>
                  <dd>{assignee?.name ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt>Estimate</dt>
                  <dd>
                    {task.estimateMinutes === undefined
                      ? 'No estimate'
                      : `${task.estimateMinutes} min`}
                  </dd>
                </div>
                <div>
                  <dt>Start date</dt>
                  <dd>
                    {task.startDate ? (
                      <time dateTime={task.startDate}>{task.startDate}</time>
                    ) : (
                      'No start date'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Due date</dt>
                  <dd>
                    {task.dueDate ? (
                      <time dateTime={task.dueDate}>{task.dueDate}</time>
                    ) : (
                      'No due date'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>
                    {deadline ? (
                      <time dateTime={deadline}>{deadline}</time>
                    ) : (
                      'No deadline'
                    )}
                    <TaskDeadlineBadge task={task} today={localDateKey()} />
                  </dd>
                </div>
                <div className="task-detail-description">
                  <dt>Description</dt>
                  <dd>{task.description || 'No description'}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {activeSection === 'checklist' ? (
            <div
              id={`task-checklist-panel-${task.id}`}
              className="task-detail-panel"
              role="tabpanel"
              aria-labelledby={`task-checklist-tab-${task.id}`}
            >
              <TaskChecklistPanel
                key={`${task.projectId}:${task.id}`}
                projectId={task.projectId}
                taskId={task.id}
              />
            </div>
          ) : null}

          {activeSection === 'files' ? (
            <div
              id={`task-files-panel-${task.id}`}
              className="task-detail-panel"
              role="tabpanel"
              aria-labelledby={`task-files-tab-${task.id}`}
            >
              <TaskLinkedFilesPanel
                key={`${task.projectId}:${task.id}`}
                projectId={task.projectId}
                taskId={task.id}
              />
            </div>
          ) : null}

          {activeSection === 'activity' ? (
            <div
              id={`task-activity-panel-${task.id}`}
              className="task-detail-panel"
              role="tabpanel"
              aria-labelledby={`task-activity-tab-${task.id}`}
            >
              <TaskActivityPanel projectId={task.projectId} taskId={task.id} />
            </div>
          ) : null}
        </div>
      )}
    </TaskEditorDrawer>
  )
}
