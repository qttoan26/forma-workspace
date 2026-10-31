import { describe, expect, it } from 'vitest'

import { parseProjectBoardSearch } from './project-board-search'

describe('parseProjectBoardSearch', () => {
  it('normalizes supported project board search values', () => {
    expect(
      parseProjectBoardSearch({
        priority: 'urgent',
        assignee: '  member-2  ',
        query: '  release notes  ',
        sort: 'priority',
        view: 'calendar',
        task: '  FOR-18  ',
      }),
    ).toEqual({
      priority: 'urgent',
      assignee: 'member-2',
      query: 'release notes',
      sort: 'priority',
      view: 'calendar',
      task: 'FOR-18',
      newTask: undefined,
    })
  })

  it('accepts due-date sorting', () => {
    expect(parseProjectBoardSearch({ sort: 'due-date' }).sort).toBe('due-date')
  })

  it('normalizes URL task creation and gives it precedence over editing', () => {
    expect(
      parseProjectBoardSearch({
        task: 'FOR-18',
        newTask: '1',
        view: 'board',
      }),
    ).toEqual({
      priority: undefined,
      assignee: undefined,
      query: undefined,
      sort: undefined,
      view: 'board',
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
        sort: 'newest',
        view: 'unknown',
        task: null,
        newTask: 'true',
        debug: 'true',
      }),
    ).toEqual({
      priority: undefined,
      assignee: undefined,
      query: undefined,
      sort: undefined,
      view: undefined,
      task: undefined,
      newTask: undefined,
    })
  })
})
