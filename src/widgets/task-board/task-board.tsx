import { useMemo, useState } from 'react'

import type { Member } from '@/entities/member/model/member'
import {
  taskStatusLabels,
  taskStatuses,
  type Task,
  type TaskStatus,
} from '@/entities/task/model/task'

interface TaskBoardProps {
  initialTasks: Task[]
  members: Member[]
}

export function TaskBoard({ initialTasks, members }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )

  function moveTask(taskId: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    )
  }

  return (
    <section className="board" aria-label="Project task board">
      {taskStatuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status)
        return (
          <section
            className="board-column"
            key={status}
            aria-labelledby={`column-${status}`}
          >
            <header className="column-header">
              <h2 id={`column-${status}`}>{taskStatusLabels[status]}</h2>
              <span aria-label={`${columnTasks.length} tasks`}>
                {columnTasks.length}
              </span>
            </header>
            <div className="task-list">
              {columnTasks.map((task) => {
                const assignee = task.assigneeId
                  ? membersById.get(task.assigneeId)
                  : undefined
                return (
                  <article className="task-card" key={task.id}>
                    <div className="task-meta">
                      <span>{task.id}</span>
                      <span className={`priority priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h3>{task.title}</h3>
                    <div className="task-footer">
                      <span title={assignee?.name}>
                        {assignee?.initials ?? '—'}
                      </span>
                      {task.dueDate ? (
                        <time dateTime={task.dueDate}>{task.dueDate}</time>
                      ) : (
                        <span>No due date</span>
                      )}
                    </div>
                    <label className="move-task">
                      <span>Move to</span>
                      <select
                        aria-label={`Move ${task.title}`}
                        value={task.status}
                        onChange={(event) =>
                          moveTask(task.id, event.target.value as TaskStatus)
                        }
                      >
                        {taskStatuses.map((option) => (
                          <option key={option} value={option}>
                            {taskStatusLabels[option]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </section>
  )
}
