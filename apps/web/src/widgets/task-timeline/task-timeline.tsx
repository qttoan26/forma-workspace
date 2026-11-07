import { useId, useRef, useState, type CSSProperties } from 'react'

import type { Member } from '@/entities/member/model/member'
import {
  getTaskDeadline,
  getTaskDeadlineState,
  taskStatusLabels,
  type Task,
} from '@/entities/task/model/task'
import { TaskDeadlineBadge } from '@/entities/task/ui/task-deadline-badge'
import {
  calendarDate,
  calendarDateKey,
  localDateKey,
} from '@/shared/lib/local-date-key'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { ChevronDownIcon } from '@/shared/ui/workspace-icons'

import {
  getTimelinePeriod,
  timelineScales,
  type TimelineScale,
} from './timeline-period'
import './task-timeline.css'

const weekdayFormat = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  timeZone: 'UTC',
})
const monthFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  timeZone: 'UTC',
})
const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

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
  const [anchor, setAnchor] = useState(() => initialDate ?? localDateKey())
  const [scale, setScale] = useState<TimelineScale>('week')
  const timelineId = useId()
  const periodStatus = useRef<HTMLParagraphElement>(null)
  const today = localDateKey()
  const period = getTimelinePeriod(anchor, scale)
  const todayColumn = period.columnFor(today)
  const memberNames = new Map(members.map(({ id, name }) => [id, name]))
  const scheduled = tasks
    .flatMap((task) => {
      const deadline = getTaskDeadline(task)
      const plannedStart = task.startDate ?? task.dueDate
      const plannedEnd = task.dueDate ?? task.startDate
      const dates = [plannedStart, plannedEnd, deadline].filter(
        (date) => date !== undefined,
      )
      const first = dates.sort()[0]
      return first ? [{ task, first, plannedStart, plannedEnd, deadline }] : []
    })
    .sort((left, right) => left.first.localeCompare(right.first))
  const visible = scheduled.flatMap(
    ({ task, plannedStart, plannedEnd, deadline }) => {
      const deadlineColumn = period.columnFor(deadline)
      const hasPlan =
        plannedStart &&
        plannedEnd &&
        plannedStart <= period.endKey &&
        plannedEnd >= period.startKey &&
        (task.startDate || task.dueDate !== deadline)
      const startColumn = hasPlan
        ? period.columnFor(
            plannedStart < period.startKey ? period.startKey : plannedStart,
          )
        : undefined
      const endColumn = hasPlan
        ? period.columnFor(
            plannedEnd > period.endKey ? period.endKey : plannedEnd,
          )
        : undefined
      if (startColumn === undefined && deadlineColumn === undefined) return []
      return [{ task, startColumn, endColumn, deadlineColumn }]
    },
  )
  const unscheduled = tasks.filter(
    (task) => !task.startDate && !getTaskDeadline(task),
  )
  const otherDates = visible.length
    ? []
    : scheduled
        .flatMap(({ first, deadline }) =>
          deadline ? [first, deadline] : [first],
        )
        .sort()
  const otherDate =
    otherDates.find((date) => date > period.endKey) ?? otherDates.at(-1)

  function openScheduledPeriod(date: string) {
    periodStatus.current?.focus()
    setAnchor(date)
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
            <TaskDeadlineBadge task={task} today={today} />
          </span>
          <span>
            {task.startDate && (
              <>
                Start{' '}
                <time dateTime={task.startDate}>
                  {dateFormat.format(calendarDate(task.startDate))}
                </time>{' '}
              </>
            )}
            {task.dueDate && (
              <>
                Due{' '}
                <time dateTime={task.dueDate}>
                  {dateFormat.format(calendarDate(task.dueDate))}
                </time>{' '}
              </>
            )}
            {task.deadline && (
              <>
                Deadline{' '}
                <time dateTime={task.deadline}>
                  {dateFormat.format(calendarDate(task.deadline))}
                </time>{' '}
              </>
            )}
            {task.estimateMinutes !== undefined && (
              <>{task.estimateMinutes} min estimated</>
            )}
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
          className="task-timeline-period"
          ref={periodStatus}
          role="status"
          tabIndex={-1}
        >
          <strong>{period.label}</strong>
          <span>
            {visible.length} scheduled {visible.length === 1 ? 'task' : 'tasks'}{' '}
            this {scale}
          </span>
        </p>
        <div
          className="task-timeline-controls"
          role="group"
          aria-label="Change timeline period"
        >
          <select
            aria-label="Timeline scale"
            value={scale}
            onChange={(event) => {
              const nextScale = timelineScales.find(
                (option) => option === event.target.value,
              )
              if (nextScale) setScale(nextScale)
            }}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <button
            aria-label={`Previous ${scale}`}
            type="button"
            onClick={() => setAnchor(period.previous)}
          >
            <ChevronDownIcon className="task-timeline-previous" />
          </button>
          <button type="button" onClick={() => setAnchor(localDateKey())}>
            Today
          </button>
          <button
            aria-label={`Next ${scale}`}
            type="button"
            onClick={() => setAnchor(period.next)}
          >
            <ChevronDownIcon className="task-timeline-next" />
          </button>
        </div>
      </div>

      <div className="task-timeline-legend">
        <span>
          <i className="task-timeline-plan" aria-hidden="true" /> Planned dates
        </span>
        <span>
          <i className="task-timeline-deadline" aria-hidden="true" /> Deadline
        </span>
      </div>

      <ScrollRegion
        label="Task timeline calendar"
        className="task-timeline-scroll"
      >
        <div
          className="task-timeline-grid"
          data-scale={scale}
          style={
            { '--timeline-columns': period.columns.length } as CSSProperties
          }
        >
          <div className="task-timeline-row task-timeline-axis">
            <span className="task-timeline-axis-label">Task / schedule</span>
            {period.columns.map((date, index) => {
              const key = calendarDateKey(date)
              return (
                <time
                  key={key}
                  dateTime={scale === 'year' ? key.slice(0, 7) : key}
                  aria-current={index + 2 === todayColumn ? 'date' : undefined}
                >
                  {scale === 'year' ? (
                    <strong>{monthFormat.format(date)}</strong>
                  ) : (
                    <>
                      <span>{weekdayFormat.format(date)}</span>
                      <strong>{date.getUTCDate()}</strong>
                    </>
                  )}
                </time>
              )
            })}
          </div>
          <ul className="task-timeline-rows" aria-label="Scheduled tasks">
            {visible.map(({ task, startColumn, endColumn, deadlineColumn }) => (
              <li
                className="task-timeline-row"
                key={task.id}
                data-deadline-state={getTaskDeadlineState(task, today)}
              >
                {renderTask(task)}
                <span className="task-timeline-track" aria-hidden="true" />
                {todayColumn !== undefined ? (
                  <span
                    className="task-timeline-today"
                    style={{ gridColumn: todayColumn }}
                    aria-hidden="true"
                  />
                ) : null}
                {startColumn !== undefined && endColumn !== undefined ? (
                  <span
                    className="task-timeline-plan"
                    data-single={startColumn === endColumn}
                    style={{ gridColumn: `${startColumn} / ${endColumn + 1}` }}
                    aria-hidden="true"
                  />
                ) : null}
                {deadlineColumn !== undefined ? (
                  <span
                    className="task-timeline-deadline"
                    style={{ gridColumn: deadlineColumn }}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {visible.length === 0 ? (
          <div className="task-timeline-empty">
            <p>
              {scheduled.length
                ? `No scheduled tasks this ${scale}.`
                : 'No scheduled tasks match this view.'}
            </p>
            {otherDate ? (
              <button
                type="button"
                onClick={() => openScheduledPeriod(otherDate)}
              >
                Go to a scheduled {scale}
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
