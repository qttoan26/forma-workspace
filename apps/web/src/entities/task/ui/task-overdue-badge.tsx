import { isTaskOverdue, type Task } from '../model/task'

import './task-overdue-badge.css'

export function TaskOverdueBadge({
  task,
  today,
}: {
  task: Task
  today: string
}) {
  if (!isTaskOverdue(task, today)) return null

  return <span className="task-overdue-badge">Overdue</span>
}
