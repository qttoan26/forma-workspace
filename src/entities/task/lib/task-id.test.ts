import { describe, expect, it } from 'vitest'

import type { Task } from '@/entities/task/model/task'

import { inferTaskIdPrefix, nextTaskId } from './task-id'

const task = (id: string): Task => ({
  id,
  projectId: 'project-1',
  title: id,
  status: 'todo',
  priority: 'medium',
})

describe('task id helpers', () => {
  it('infers the prefix from an existing numeric task id', () => {
    expect(inferTaskIdPrefix([task('OPS-7')])).toBe('OPS')
  })

  it('returns undefined when no task id has a numeric suffix', () => {
    expect(inferTaskIdPrefix([task('draft')])).toBeUndefined()
  })

  it('increments only ids belonging to the requested prefix', () => {
    expect(nextTaskId([task('OPS-02'), task('FOR-99'), task('OPS-09')], 'OPS')).toBe(
      'OPS-10',
    )
  })

  it('normalizes project keys and provides a safe fallback', () => {
    expect(nextTaskId([], ' customer success ')).toBe('CUSTOMER-SUCCESS-01')
    expect(nextTaskId([], '---')).toBe('TASK-01')
  })
})
