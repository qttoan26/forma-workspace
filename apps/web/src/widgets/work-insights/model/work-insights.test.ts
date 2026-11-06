import { describe, expect, it } from 'vitest'

import type { Task } from '@/entities/task/model/task'
import { members } from '@/test/fixtures/project-board'

import { summarizeWork } from './work-insights'

describe('work insight totals', () => {
  it('reconciles every status and owner, including absent and unknown owners', () => {
    const tasks: Task[] = [
      {
        id: 'A',
        projectId: 'project-1',
        title: 'First task',
        status: 'todo',
        priority: 'high',
        assigneeId: members[0]!.id,
      },
      {
        id: 'B',
        projectId: 'project-1',
        title: 'Second task',
        status: 'done',
        priority: 'low',
        assigneeId: members[0]!.id,
      },
      {
        id: 'C',
        projectId: 'project-1',
        title: 'Third task',
        status: 'in-progress',
        priority: 'medium',
        assigneeId: 'missing-owner',
      },
      {
        id: 'D',
        projectId: 'project-1',
        title: 'Fourth task',
        status: 'backlog',
        priority: 'low',
      },
    ]
    const snapshot = structuredClone(tasks)
    const result = summarizeWork(tasks, members)
    expect(result.total).toBe(4)
    expect(result.completed).toBe(1)
    expect(result.completion).toBe(25)
    expect(result.statuses.map((item) => item.count)).toEqual([1, 1, 1, 1])
    expect(
      result.owners.find((owner) => owner.name === 'Unassigned'),
    ).toMatchObject({ open: 2, completed: 0 })
    expect(
      result.owners.reduce(
        (sum, owner) => sum + owner.open + owner.completed,
        0,
      ),
    ).toBe(result.total)
    expect(tasks).toEqual(snapshot)
  })

  it('handles empty snapshots and completed-only work without invalid percentages', () => {
    const empty = summarizeWork([], members)
    expect(empty.completion).toBe(0)
    expect(empty.statuses.every((item) => item.count === 0)).toBe(true)
    const done = summarizeWork(
      [
        {
          id: 'A',
          projectId: 'project-1',
          title: 'Finished task',
          status: 'done',
          priority: 'low',
        },
      ],
      members,
    )
    expect(done.completion).toBe(100)
    expect(done.owners.reduce((sum, owner) => sum + owner.open, 0)).toBe(0)
  })
})
