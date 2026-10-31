import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import type { Member } from '@/entities/member/model/member'
import { appendTaskActivityToIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { createTaskActivityEntry } from '@/entities/task/model/task-activity'
import {
  taskPriorities,
  taskStatusLabels,
  taskStatuses,
  type Task,
} from '@/entities/task/model/task'
import { Button, Field } from '@/shared/ui'

import {
  clearTaskFormDraft,
  loadTaskFormDraft,
  saveTaskFormDraft,
} from '../lib/task-form-draft'
import { taskFormSchema, type TaskFormValues } from '../model/task-form-schema'
import { TaskActivityPanel } from './task-activity-panel'
import { TaskChecklistPanel } from './task-checklist-panel'

interface TaskFormProps {
  members: Member[]
  task?: Task
  draftKey?: string
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => void
}

type TaskDetailSection = 'details' | 'checklist' | 'activity'

export function TaskForm({
  members,
  task,
  draftKey,
  onCancel,
  onSubmit,
}: TaskFormProps) {
  const [activeSection, setActiveSection] =
    useState<TaskDetailSection>('details')
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getInitialValues(task, draftKey),
  })
  const draftValues = useWatch({ control })

  useEffect(() => {
    reset(getInitialValues(task, draftKey))
  }, [draftKey, reset, task])

  useEffect(() => {
    if (!draftKey) return
    saveTaskFormDraft(draftKey, draftValues)
  }, [draftKey, draftValues])

  function cancelForm() {
    if (draftKey) clearTaskFormDraft(draftKey)
    onCancel()
  }

  function submitForm(values: TaskFormValues) {
    if (draftKey) clearTaskFormDraft(draftKey)
    if (task) recordTaskUpdateActivity(task, values)
    onSubmit(values)
  }

  return (
    <form
      className="task-form"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        cancelForm()
      }}
      onSubmit={(event) => {
        void handleSubmit(submitForm)(event)
      }}
    >
      <div className="task-form-heading">
        <div>
          <p className="eyebrow">{task ? 'Edit task' : 'New task'}</p>
          <h2>{task ? task.title : 'Create a task'}</h2>
        </div>
        <Button type="button" aria-keyshortcuts="Escape" onClick={cancelForm}>
          Cancel
        </Button>
      </div>

      {task ? (
        <div
          className="task-detail-tabs"
          role="tablist"
          aria-label="Task details"
        >
          <button
            id={`task-details-tab-${task.id}`}
            type="button"
            role="tab"
            aria-selected={activeSection === 'details'}
            aria-controls={`task-details-panel-${task.id}`}
            onClick={() => setActiveSection('details')}
          >
            Details
          </button>
          <button
            id={`task-checklist-tab-${task.id}`}
            type="button"
            role="tab"
            aria-selected={activeSection === 'checklist'}
            aria-controls={`task-checklist-panel-${task.id}`}
            onClick={() => setActiveSection('checklist')}
          >
            Checklist
          </button>
          <button
            id={`task-activity-tab-${task.id}`}
            type="button"
            role="tab"
            aria-selected={activeSection === 'activity'}
            aria-controls={`task-activity-panel-${task.id}`}
            onClick={() => setActiveSection('activity')}
          >
            Activity
          </button>
        </div>
      ) : null}

      {!task || activeSection === 'details' ? (
        <div
          id={task ? `task-details-panel-${task.id}` : undefined}
          className="task-detail-panel"
          role={task ? 'tabpanel' : undefined}
          aria-labelledby={task ? `task-details-tab-${task.id}` : undefined}
        >
          <Field label="Title" error={errors.title?.message}>
            <input autoFocus {...register('title')} />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea rows={4} {...register('description')} />
          </Field>

          <div className="task-form-grid">
            <Field label="Status">
              <select {...register('status')}>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {taskStatusLabels[status]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select {...register('priority')}>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="task-form-grid">
            <Field label="Assignee">
              <select {...register('assigneeId')}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Due date">
              <input type="date" {...register('dueDate')} />
            </Field>
          </div>

          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      ) : null}

      {task && activeSection === 'checklist' ? (
        <div
          id={`task-checklist-panel-${task.id}`}
          className="task-detail-panel"
          role="tabpanel"
          aria-labelledby={`task-checklist-tab-${task.id}`}
        >
          <TaskChecklistPanel projectId={task.projectId} taskId={task.id} />
        </div>
      ) : null}

      {task && activeSection === 'activity' ? (
        <div
          id={`task-activity-panel-${task.id}`}
          className="task-detail-panel"
          role="tabpanel"
          aria-labelledby={`task-activity-tab-${task.id}`}
        >
          <TaskActivityPanel projectId={task.projectId} taskId={task.id} />
        </div>
      ) : null}
    </form>
  )
}

function getInitialValues(task?: Task, draftKey?: string): TaskFormValues {
  if (draftKey) {
    const draft = loadTaskFormDraft(draftKey)
    if (draft) return draft
  }
  return toFormValues(task)
}

function toFormValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    assigneeId: task?.assigneeId ?? '',
    dueDate: task?.dueDate ?? '',
  }
}

function recordTaskUpdateActivity(task: Task, values: TaskFormValues) {
  const body = describeTaskChanges(task, values)
  if (!body) return

  const entry = createTaskActivityEntry({
    projectId: task.projectId,
    taskId: task.id,
    kind: 'event',
    body,
    authorLabel: 'You',
  })

  void appendTaskActivityToIndexedDb(task.projectId, task.id, entry).catch(
    () => undefined,
  )
}

function describeTaskChanges(task: Task, values: TaskFormValues) {
  const changes: string[] = []

  if (task.title !== values.title) changes.push('title')
  if ((task.description ?? '') !== values.description)
    changes.push('description')
  if (task.status !== values.status) {
    changes.push(
      `status (${taskStatusLabels[task.status]} → ${taskStatusLabels[values.status]})`,
    )
  }
  if (task.priority !== values.priority) changes.push('priority')
  if ((task.assigneeId ?? '') !== values.assigneeId) changes.push('assignee')
  if ((task.dueDate ?? '') !== values.dueDate) changes.push('due date')

  if (changes.length === 0) return null
  return `Updated ${changes.join(', ')}.`
}
