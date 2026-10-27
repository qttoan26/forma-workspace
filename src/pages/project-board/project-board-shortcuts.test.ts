import { describe, expect, it } from 'vitest'

import { getProjectBoardShortcut } from './project-board-shortcuts'

describe('getProjectBoardShortcut', () => {
  it('maps slash and n to board actions', () => {
    expect(getProjectBoardShortcut({ key: '/', target: document.body })).toBe(
      'focus-search',
    )
    expect(getProjectBoardShortcut({ key: 'N', target: document.body })).toBe(
      'create-task',
    )
  })

  it('ignores shortcuts while typing in editable controls', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const editable = document.createElement('div')
    editable.contentEditable = 'true'

    for (const target of [input, textarea, select, editable]) {
      expect(getProjectBoardShortcut({ key: '/', target })).toBeNull()
      expect(getProjectBoardShortcut({ key: 'n', target })).toBeNull()
    }
  })

  it('ignores modified shortcuts and unrelated keys', () => {
    expect(
      getProjectBoardShortcut({ key: '/', target: document.body, ctrlKey: true }),
    ).toBeNull()
    expect(
      getProjectBoardShortcut({ key: 'n', target: document.body, metaKey: true }),
    ).toBeNull()
    expect(getProjectBoardShortcut({ key: 'x', target: document.body })).toBeNull()
  })
})
