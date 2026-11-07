import { getTaskDeadlineState, type Task } from '../model/task'

import './task-deadline-badge.css'

export function TaskDeadlineBadge({
  task,
  today,
}: {
  task: Task
  today: string
}) {
  const state = getTaskDeadlineState(task, today)
  if (!state) return null

  return (
    <span className="task-deadline-badge" data-deadline-state={state}>
      {state === 'overdue' ? 'Overdue' : 'Due soon'}
    </span>
  )
}
