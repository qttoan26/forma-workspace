import { describe, expect, it } from 'vitest'

import type { Task } from '@/entities/task/model/task'

import {
  filterTasks,
  groupTasksByStatus,
  sortTasks,
  updateTaskStatus,
} from './task-board-view'

const tasks: Task[] = [
  {
    id: 'FOR-1',
    projectId: 'project-1',
    title: 'Design board navigation',
    description: 'Plan keyboard and focus behavior for the board',
    status: 'todo',
    priority: 'high',
    assigneeId: 'member-1',
  },
  {
    id: 'FOR-2',
    projectId: 'project-1',
    title: 'Measure task rendering',
    status: 'in-progress',
    priority: 'urgent',
    assigneeId: 'member-2',
  },
]

const sortableTasks: Task[] = [
  {
    ...tasks[0],
    id: 'FOR-3',
    priority: 'low',
    dueDate: '2026-11-20',
  },
  {
    ...tasks[1],
    id: 'FOR-4',
    priority: 'urgent',
    dueDate: '2026-11-10',
  },
  {
    ...tasks[0],
    id: 'FOR-5',
    priority: 'medium',
  },
]

describe('task board view transforms', () => {
  it('filters by search, priority, and assignee', () => {
    expect(
      filterTasks(tasks, {
        query: 'render',
        priority: 'urgent',
        assigneeId: 'member-2',
      }),
    ).toEqual([tasks[1]])
  })

  it('searches task descriptions case-insensitively', () => {
    expect(filterTasks(tasks, { query: 'FOCUS BEHAVIOR' })).toEqual([tasks[0]])
  })

  it('sorts tasks by priority without mutating board order', () => {
    expect(sortTasks(sortableTasks, 'priority').map((task) => task.id)).toEqual([
      'FOR-4',
      'FOR-5',
      'FOR-3',
    ])
    expect(sortableTasks.map((task) => task.id)).toEqual([
      'FOR-3',
      'FOR-4',
      'FOR-5',
    ])
  })

  it('sorts due dates ascending with undated tasks last', () => {
    expect(sortTasks(sortableTasks, 'due-date').map((task) => task.id)).toEqual([
      'FOR-4',
      'FOR-3',
      'FOR-5',
    ])
  })

  it('combines filtering and sorting in the visible task transform', () => {
    expect(
      filterTasks(sortableTasks, {
        query: 'board',
        sort: 'priority',
      }).map((task) => task.id),
    ).toEqual(['FOR-5', 'FOR-3'])
  })

  it('groups tasks by status in one pass', () => {
    const columns = groupTasksByStatus(tasks)

    expect(columns.todo).toEqual([tasks[0]])
    expect(columns['in-progress']).toEqual([tasks[1]])
    expect(columns.backlog).toEqual([])
    expect(columns.done).toEqual([])
  })

  it('updates one task status without mutating the input', () => {
    const updated = updateTaskStatus(tasks, 'FOR-1', 'done')

    expect(updated[0]?.status).toBe('done')
    expect(tasks[0]?.status).toBe('todo')
    expect(updated[1]).toBe(tasks[1])
  })
})
