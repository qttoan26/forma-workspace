import { useId, useRef, useState } from 'react'

import type { Member } from '@/entities/member/model/member'
import { taskStatusLabels, type Task } from '@/entities/task/model/task'
import { TaskOverdueBadge } from '@/entities/task/ui/task-overdue-badge'
import { localDateKey } from '@/shared/lib/local-date-key'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { ChevronDownIcon } from '@/shared/ui/workspace-icons'

import './task-timeline.css'

const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'short' })
const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
})
const weekFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function parseDateKey(date: string) {
  return new Date(`${date}T12:00:00`)
}

function startOfWeek(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7))
}

type TaskTimelineAction =
  | { onOpenTask: (taskId: string) => void; getTaskHref?: never }
  | { getTaskHref: (taskId: string) => string; onOpenTask?: never }

export function TaskTimeline({
  tasks,
  members,
  initialDate,
  onOpenTask,
  getTaskHref,
}: {
  tasks: Task[]
  members: Member[]
  initialDate?: string | undefined
} & TaskTimelineAction) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(initialDate ? parseDateKey(initialDate) : new Date()),
  )
  const timelineId = useId()
  const weekStatus = useRef<HTMLParagraphElement>(null)
  const today = localDateKey()
  const weekEnd = addDays(weekStart, 6)
  const dates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  )
  const dateKeys = dates.map(localDateKey)
  const todayColumn = dateKeys.indexOf(today) + 2
  const startKey = localDateKey(weekStart)
  const endKey = localDateKey(weekEnd)
  const scheduled = tasks
    .flatMap((task) => (task.dueDate ? [{ task, date: task.dueDate }] : []))
    .sort((left, right) => left.date.localeCompare(right.date))
  const weekTasks = scheduled.filter(
    ({ date }) => date >= startKey && date <= endKey,
  )
  const unscheduled = tasks.filter((task) => !task.dueDate)
  const memberNames = new Map(members.map(({ id, name }) => [id, name]))
  const otherDate =
    scheduled.find(({ date }) => date > endKey)?.date ?? scheduled.at(-1)?.date

  function openScheduledWeek(date: string) {
    weekStatus.current?.focus()
    setWeekStart(startOfWeek(parseDateKey(date)))
  }

  function renderTask(task: Task) {
    const descriptionId = `${timelineId}-${encodeURIComponent(task.id)}`
    const content = (
      <>
        <strong>{task.title}</strong>
        <span id={descriptionId} className="task-timeline-task-details">
          <span>
            {task.id} · {taskStatusLabels[task.status]} · {task.priority}{' '}
            priority
          </span>
          <span>
            {memberNames.get(task.assigneeId ?? '') ?? 'Unassigned'}
            {task.dueDate ? (
              <>
                {' · Due '}
                <time dateTime={task.dueDate}>
                  {dateFormat.format(parseDateKey(task.dueDate))}
                </time>
                <TaskOverdueBadge task={task} today={today} />
              </>
            ) : null}
          </span>
        </span>
      </>
    )

    return getTaskHref ? (
      <a
        className="task-timeline-task"
        href={getTaskHref(task.id)}
        aria-label={`Open ${task.title}`}
        aria-describedby={descriptionId}
      >
        {content}
      </a>
    ) : (
      <button
        className="task-timeline-task"
        type="button"
        aria-label={`Open ${task.title}`}
        aria-describedby={descriptionId}
        onClick={() => onOpenTask(task.id)}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="task-timeline">
      <div className="task-timeline-toolbar">
        <p
          className="task-timeline-week"
          ref={weekStatus}
          role="status"
          tabIndex={-1}
        >
          <strong>{weekFormat.formatRange(weekStart, weekEnd)}</strong>
          <span>
            {weekTasks.length}{' '}
            {weekTasks.length === 1 ? 'deadline' : 'deadlines'} this week
          </span>
        </p>
        <div
          className="task-timeline-controls"
          role="group"
          aria-label="Change timeline week"
        >
          <button
            aria-label="Previous week"
            type="button"
            onClick={() => setWeekStart((date) => addDays(date, -7))}
          >
            <ChevronDownIcon className="task-timeline-previous" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Today
          </button>
          <button
            aria-label="Next week"
            type="button"
            onClick={() => setWeekStart((date) => addDays(date, 7))}
          >
            <ChevronDownIcon className="task-timeline-next" />
          </button>
        </div>
      </div>

      <ScrollRegion
        label="Task timeline calendar"
        className="task-timeline-scroll"
      >
        <div className="task-timeline-grid">
          <div className="task-timeline-row task-timeline-axis">
            <span className="task-timeline-axis-label">Task / deadline</span>
            {dates.map((date, index) => (
              <time
                key={dateKeys[index]}
                dateTime={dateKeys[index]}
                aria-current={dateKeys[index] === today ? 'date' : undefined}
              >
                <span>{weekdayFormat.format(date)}</span>
                <strong>{date.getDate()}</strong>
              </time>
            ))}
          </div>
          <ul className="task-timeline-rows" aria-label="Scheduled tasks">
            {weekTasks.map(({ task, date }) => (
              <li className="task-timeline-row" key={task.id}>
                {renderTask(task)}
                <span className="task-timeline-track" aria-hidden="true" />
                {todayColumn > 1 ? (
                  <span
                    className="task-timeline-today"
                    style={{ gridColumn: todayColumn }}
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className="task-timeline-deadline"
                  style={{ gridColumn: dateKeys.indexOf(date) + 2 }}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        </div>

        {weekTasks.length === 0 ? (
          <div className="task-timeline-empty">
            <p>
              {scheduled.length
                ? 'No deadlines this week.'
                : 'No scheduled tasks match this view.'}
            </p>
            {otherDate ? (
              <button
                type="button"
                onClick={() => openScheduledWeek(otherDate)}
              >
                Go to a scheduled week
              </button>
            ) : null}
          </div>
        ) : null}

        {unscheduled.length ? (
          <details className="task-timeline-unscheduled">
            <summary>Unscheduled ({unscheduled.length})</summary>
            <ul aria-label="Unscheduled tasks">
              {unscheduled.map((task) => (
                <li key={task.id}>{renderTask(task)}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </ScrollRegion>
    </div>
  )
}
