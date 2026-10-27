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
      newTask: undefined,
    })
  })

  it('normalizes URL task creation and gives it precedence over editing', () => {
    expect(
      parseProjectBoardSearch({
        task: 'FOR-18',
        newTask: '1',
      }),
    ).toEqual({
      priority: undefined,
      assignee: undefined,
      query: undefined,
      task: undefined,
      newTask: '1',
    })
  })

  it('drops invalid, empty, and unknown search values', () => {
    expect(
      parseProjectBoardSearch({
        priority: 'critical',
        assignee: '   ',
        query: 42,
        task: null,
        newTask: 'true',
        debug: 'true',
      }),
    ).toEqual({
      priority: undefined,
      assignee: undefined,
      query: undefined,
      task: undefined,
      newTask: undefined,
    })
  })
})
