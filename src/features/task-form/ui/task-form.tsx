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
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <label>
        <span>Title</span>
        <input autoFocus {...register('title')} />
        {errors.title ? (
          <small role="alert">{errors.title.message}</small>
        ) : null}
      </label>

      <div className="task-form-grid">
        <label>
          <span>Status</span>
          <select {...register('status')}>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Priority</span>
          <select {...register('priority')}>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="task-form-grid">
        <label>
          <span>Assignee</span>
          <select {...register('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Due date</span>
          <input type="date" {...register('dueDate')} />
        </label>
      </div>

      <button className="button-primary" type="submit" disabled={isSubmitting}>
        {task ? 'Save changes' : 'Create task'}
      </button>
    </form>
  )
}

function toFormValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    assigneeId: task?.assigneeId ?? '',
    dueDate: task?.dueDate ?? '',
  }
}
