import { describe, expect, it } from 'vitest'

import { searchWorkspaceNavigation } from './navigation-search'

describe('workspace navigation search', () => {
  it('ranks the section name ahead of a parent module mentioning the same term', () => {
    const result = searchWorkspaceNavigation('OCR')
    expect(result.entries[0]).toMatchObject({
      label: 'OCR & extraction',
      context: 'Documents & Data',
      path: '/modules/documents/ocr',
      status: 'implementation',
    })
  })

  it('matches multiple terms across a section and its module', () => {
    const result = searchWorkspaceNavigation('admin permissions')
    expect(result.entries).toEqual([
      expect.objectContaining({
        label: 'Roles & permissions',
        path: '/modules/admin/access',
      }),
    ])
  })

  it('retains context for overview destinations with the same label', () => {
    const result = searchWorkspaceNavigation('overview')
    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Overview',
          context: 'Workspace',
          path: '/',
        }),
        expect.objectContaining({
          label: 'Overview',
          context: 'Work',
          path: '/modules/work/overview',
        }),
      ]),
    )
  })

  it('treats case and extra spaces consistently and never invents a destination', () => {
    expect(searchWorkspaceNavigation('  DoCuMeNt   InTaKe  ')).toEqual(
      searchWorkspaceNavigation('document intake'),
    )
    expect(searchWorkspaceNavigation('missing-destination')).toEqual({
      entries: [],
      total: 0,
    })
    expect(searchWorkspaceNavigation('FOR-18')).toEqual({
      entries: [],
      total: 0,
    })
  })
})
