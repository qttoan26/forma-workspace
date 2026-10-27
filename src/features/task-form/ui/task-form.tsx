import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import type { Member } from '@/entities/member/model/member'
import {
  taskPriorities,
  taskStatusLabels,
  taskStatuses,
  type Task,
} from '@/entities/task/model/task'
import { Button, Field } from '@/shared/ui'

import { taskFormSchema, type TaskFormValues } from '../model/task-form-schema'

interface TaskFormProps {
  members: Member[]
  task?: Task
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => void
}

export function TaskForm({ members, task, onCancel, onSubmit }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toFormValues(task),
  })

  useEffect(() => {
    reset(toFormValues(task))
  }, [reset, task])

  return (
    <form
      className="task-form"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event)
      }}
    >
      <div className="task-form-heading">
        <div>
          <p className="eyebrow">{task ? 'Edit task' : 'New task'}</p>
          <h2>{task ? task.title : 'Create a task'}</h2>
        </div>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>

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
    </form>
  )
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
