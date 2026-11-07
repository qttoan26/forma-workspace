import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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
import './task-form.css'

interface TaskFormProps {
  members: Member[]
  task?: Task
  draftKey?: string
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => void
}

export function TaskForm({
  members,
  task,
  draftKey,
  onCancel,
  onSubmit,
}: TaskFormProps) {
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

      <div className="task-detail-panel">
        <Field label="Title" error={errors.title?.message}>
          <input
            autoFocus={Boolean(task)}
            data-modal-autofocus
            {...register('title')}
          />
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

          <Field
            label="Estimate (minutes)"
            error={errors.estimateMinutes?.message}
          >
            <input
              type="number"
              min="1"
              step="1"
              {...register('estimateMinutes')}
            />
          </Field>
        </div>

        <div className="task-form-grid">
          <Field label="Start date" error={errors.startDate?.message}>
            <input type="date" {...register('startDate')} />
          </Field>
          <Field label="Due date" error={errors.dueDate?.message}>
            <input type="date" {...register('dueDate')} />
          </Field>
          <Field label="Deadline" error={errors.deadline?.message}>
            <input type="date" {...register('deadline')} />
          </Field>
          <p className="task-form-schedule-hint">
            Due date is the planned finish. Leave Deadline blank to use the due
            date for alerts.
          </p>
        </div>

        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  )
}

function getInitialValues(task?: Task, draftKey?: string): TaskFormValues {
  const saved = toFormValues(task)
  const draft = draftKey ? loadTaskFormDraft(draftKey) : null
  if (!draft) return saved

  return {
    ...saved,
    ...draft,
    startDate: draft.startDate ?? saved.startDate,
    deadline: draft.deadline ?? saved.deadline,
    estimateMinutes: draft.estimateMinutes ?? saved.estimateMinutes,
  }
}

function toFormValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    assigneeId: task?.assigneeId ?? '',
    startDate: task?.startDate ?? '',
    dueDate: task?.dueDate ?? '',
    deadline: task?.deadline ?? '',
    estimateMinutes: String(task?.estimateMinutes ?? ''),
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
  if ((task.startDate ?? '') !== values.startDate) changes.push('start date')
  if ((task.dueDate ?? '') !== values.dueDate) changes.push('due date')
  if ((task.deadline ?? '') !== values.deadline) changes.push('deadline')
  if (String(task.estimateMinutes ?? '') !== values.estimateMinutes)
    changes.push('estimate')

  if (changes.length === 0) return null
  return `Updated ${changes.join(', ')}.`
}
