import { describe, expect, it } from 'vitest'

import { parseProjectBoardData } from './project-board-data-parser'

const validBoardData = {
  workspace: {
    id: 'ws-1',
    name: 'Forma',
    slug: 'forma',
  },
  project: {
    id: 'project-1',
    workspaceId: 'ws-1',
    name: 'Product launch',
    key: 'FOR',
    description: 'Ship Forma Workspace.',
  },
  members: [
    {
      id: 'member-1',
      name: 'Alex Morgan',
      initials: 'AM',
      role: 'Design',
    },
  ],
  initialTasks: [
    {
      id: 'FOR-1',
      projectId: 'project-1',
      title: 'Define project board',
      status: 'todo' as const,
      priority: 'medium' as const,
      assigneeId: 'member-1',
    },
  ],
}

describe('parseProjectBoardData', () => {
  it('parses a valid project board snapshot', () => {
    expect(parseProjectBoardData(validBoardData)).toEqual(validBoardData)
  })

  it('rejects a project from another workspace', () => {
    expect(() =>
      parseProjectBoardData({
        ...validBoardData,
        project: {
          ...validBoardData.project,
          workspaceId: 'ws-2',
        },
      }),
    ).toThrow()
  })

  it('rejects a task assigned to an unknown member', () => {
    expect(() =>
      parseProjectBoardData({
        ...validBoardData,
        initialTasks: [
          {
            ...validBoardData.initialTasks[0],
            assigneeId: 'member-missing',
          },
        ],
      }),
    ).toThrow()
  })
})
