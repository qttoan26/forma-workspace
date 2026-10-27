import { describe, expect, it } from 'vitest'

import { parseProjectBoardSearch } from './project-board-search'

describe('parseProjectBoardSearch', () => {
  it('normalizes supported project board search values', () => {
    expect(
      parseProjectBoardSearch({
        priority: 'urgent',
        assignee: '  member-2  ',
        query: '  release notes  ',
        task: '  FOR-18  ',
      }),
    ).toEqual({
      priority: 'urgent',
      assignee: 'member-2',
      query: 'release notes',
      task: 'FOR-18',
    })
  })

  it('drops invalid, empty, and unknown search values', () => {
    expect(
      parseProjectBoardSearch({
        priority: 'critical',
        assignee: '   ',
        query: 42,
        task: null,
        debug: 'true',
      }),
    ).toEqual({
      priority: undefined,
      assignee: undefined,
      query: undefined,
      task: undefined,
    })
  })
})
