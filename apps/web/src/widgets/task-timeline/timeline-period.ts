import { calendarDate, calendarDateKey } from '@/shared/lib/local-date-key'

export const timelineScales = ['week', 'month', 'year'] as const
export type TimelineScale = (typeof timelineScales)[number]

const dayFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const monthFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function getTimelinePeriod(anchor: string, scale: TimelineScale) {
  const start = calendarDate(anchor)
  if (scale === 'week') {
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
  } else {
    start.setUTCDate(1)
    if (scale === 'year') start.setUTCMonth(0)
  }

  function shift(offset: number) {
    const date = new Date(start)
    if (scale === 'week') date.setUTCDate(date.getUTCDate() + offset * 7)
    if (scale === 'month') date.setUTCMonth(date.getUTCMonth() + offset)
    if (scale === 'year') date.setUTCFullYear(date.getUTCFullYear() + offset)
    return date
  }

  const end = shift(1)
  end.setUTCDate(end.getUTCDate() - 1)
  const columnCount =
    scale === 'year' ? 12 : scale === 'month' ? end.getUTCDate() : 7
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const date = new Date(start)
    if (scale === 'year') date.setUTCMonth(index)
    else date.setUTCDate(date.getUTCDate() + index)
    return date
  })
  const startKey = calendarDateKey(start)
  const endKey = calendarDateKey(end)
  const label =
    scale === 'year'
      ? String(start.getUTCFullYear())
      : scale === 'month'
        ? monthFormat.format(start)
        : dayFormat.formatRange(start, end)

  function columnFor(date: string | undefined) {
    if (!date || date < startKey || date > endKey) return undefined
    if (scale === 'year') return Number(date.slice(5, 7)) + 1
    const index = (calendarDate(date).getTime() - start.getTime()) / 86_400_000
    return index + 2
  }

  return {
    columns,
    startKey,
    endKey,
    label,
    columnFor,
    previous: calendarDateKey(shift(-1)),
    next: calendarDateKey(shift(1)),
  }
}
