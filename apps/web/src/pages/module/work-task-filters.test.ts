import { describe, expect, it } from 'vitest'
import { localDateKey } from '@/shared/lib/local-date-key'
import type { Task } from '@/entities/task/model/task'
import {
  compactWorkTaskSearch,
  defaultWorkTaskSearch,
  filterWorkTasks,
  parseWorkTaskSearch,
} from './work-task-filters'

const now = new Date(2026, 10, 1, 23, 50)
const tasks: Task[] = [
  {
    id: 'FOR-1',
    projectId: 'project-1',
    title: 'Urgent intake',
    description: 'Scan customer pages',
    status: 'todo',
    priority: 'urgent',
    assigneeId: 'member-2',
    dueDate: '2026-10-31',
  },
  {
    id: 'FOR-2',
    projectId: 'project-1',
    title: 'Today review',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-11-01',
  },
  {
    id: 'FOR-3',
    projectId: 'project-1',
    title: 'Completed yesterday',
    status: 'done',
    priority: 'low',
    assigneeId: 'member-2',
    dueDate: '2026-10-30',
  },
  {
    id: 'FOR-4',
    projectId: 'project-1',
    title: 'Week boundary',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-11-07',
  },
  {
    id: 'FOR-5',
    projectId: 'project-1',
    title: 'Outside next seven days',
    status: 'backlog',
    priority: 'medium',
    dueDate: '2026-11-08',
  },
  {
    id: 'FOR-6',
    projectId: 'project-1',
    title: 'Unscheduled work',
    status: 'backlog',
    priority: 'high',
  },
]
const members = [
  { id: 'member-2', name: 'Sam Lee', initials: 'SL', role: 'Developer' },
]
const ids = (search: Record<string, unknown>) =>
  filterWorkTasks(tasks, members, parseWorkTaskSearch(search), now).map(
    (task) => task.id,
  )

describe('Work task filters', () => {
  it('normalizes invalid URL values and omits defaults from navigation', () => {
    expect(
      parseWorkTaskSearch({
        scope: 'deleted',
        status: 'review',
        query: [],
        due: '2026',
        priority: ['high'],
      }),
    ).toEqual(defaultWorkTaskSearch)
    expect(compactWorkTaskSearch(defaultWorkTaskSearch)).toEqual({})
    expect(
      compactWorkTaskSearch(
        parseWorkTaskSearch({ scope: 'open', query: 'scan' }),
      ),
    ).toEqual({ scope: 'open', query: 'scan' })
  })
  it('excludes completed work from overdue and open scopes', () => {
    expect(ids({ scope: 'overdue' })).toEqual(['FOR-1'])
    expect(ids({ scope: 'open' })).not.toContain('FOR-3')
    expect(ids({ scope: 'completed' })).toEqual(['FOR-3'])
  })
  it('uses local calendar dates and an inclusive seven-day boundary', () => {
    expect(localDateKey(now)).toBe('2026-11-01')
    expect(ids({ due: 'today' })).toEqual(['FOR-2'])
    expect(ids({ due: 'week' })).toEqual(['FOR-2', 'FOR-4'])
    expect(ids({ due: 'none' })).toEqual(['FOR-6'])
  })
  it('combines priority, assignee, status, scope and case-insensitive text', () => {
    expect(
      ids({
        scope: 'open',
        status: 'todo',
        priority: 'urgent',
        assignee: 'member-2',
        query: ' SAM LEE ',
      }),
    ).toEqual(['FOR-1'])
    expect(ids({ query: 'SCAN CUSTOMER' })).toEqual(['FOR-1'])
    expect(ids({ query: 'for-6' })).toEqual(['FOR-6'])
    expect(ids({ scope: 'completed', assignee: 'unassigned' })).toEqual([])
    expect(ids({ assignee: 'missing-member' })).toEqual([])
  })
})
