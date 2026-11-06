import type { Member } from '@/entities/member/model/member'
import {
  isTaskOverdue,
  taskPriorities,
  taskStatuses,
  type Task,
} from '@/entities/task/model/task'
import { localDateKey } from '@/shared/lib/local-date-key'

export const workTaskScopes = ['all', 'open', 'overdue', 'completed'] as const
export const workDueFilters = ['all', 'today', 'week', 'none'] as const

export function parseWorkTaskSearch(search: Record<string, unknown>) {
  return {
    query: typeof search.query === 'string' ? search.query : '',
    scope: pick(search.scope, workTaskScopes, 'all'),
    status: pick(search.status, ['all', ...taskStatuses] as const, 'all'),
    priority: pick(search.priority, ['all', ...taskPriorities] as const, 'all'),
    assignee:
      typeof search.assignee === 'string' && search.assignee
        ? search.assignee
        : 'all',
    due: pick(search.due, workDueFilters, 'all'),
  }
}

export type WorkTaskSearch = ReturnType<typeof parseWorkTaskSearch>
export const defaultWorkTaskSearch = parseWorkTaskSearch({})

export function compactWorkTaskSearch(search: WorkTaskSearch) {
  return Object.fromEntries(
    Object.entries(search).filter(
      ([key, value]) =>
        value !== defaultWorkTaskSearch[key as keyof WorkTaskSearch],
    ),
  )
}

export function filterWorkTasks(
  tasks: Task[],
  members: Member[],
  search: WorkTaskSearch,
  now = new Date(),
) {
  const today = localDateKey(now)
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 6)
  const lastDay = localDateKey(weekEnd)
  const query = search.query.trim().toLocaleLowerCase()
  const names = new Map(members.map((member) => [member.id, member.name]))
  return tasks.filter((task) => {
    if (search.scope === 'open' && task.status === 'done') return false
    if (search.scope === 'completed' && task.status !== 'done') return false
    if (search.scope === 'overdue' && !isTaskOverdue(task, today)) return false
    if (search.status !== 'all' && task.status !== search.status) return false
    if (search.priority !== 'all' && task.priority !== search.priority)
      return false
    if (
      search.assignee === 'unassigned'
        ? Boolean(task.assigneeId)
        : search.assignee !== 'all' && task.assigneeId !== search.assignee
    )
      return false
    if (search.due === 'none' && task.dueDate) return false
    if (search.due === 'today' && task.dueDate !== today) return false
    if (
      search.due === 'week' &&
      (!task.dueDate || task.dueDate < today || task.dueDate > lastDay)
    )
      return false
    return (
      !query ||
      [
        task.id,
        task.title,
        task.description,
        task.assigneeId ? names.get(task.assigneeId) : 'Unassigned',
      ].some((value) => value?.toLocaleLowerCase().includes(query))
    )
  })
}

function pick<const T extends readonly string[]>(
  value: unknown,
  choices: T,
  fallback: T[number],
): T[number] {
  return typeof value === 'string' && choices.includes(value) ? value : fallback
}
