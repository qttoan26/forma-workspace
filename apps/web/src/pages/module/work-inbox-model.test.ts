import { describe, expect, it } from 'vitest'
import {
  buildInboxItems,
  inboxReadPrefix,
  mentionsMember,
} from './work-inbox-model'
import {
  initialTasks,
  members,
  project,
  workspace,
} from '@/pages/project-board/project-board-data'
import type { TaskActivityEntry } from '@/entities/task/model/task-activity'

const data = { initialTasks, members, project, workspace }
const comment: TaskActivityEntry = {
  id: 'comment-1',
  projectId: project.id,
  taskId: 'FOR-18',
  kind: 'comment',
  body: '@Sam Lee, please review.',
  createdAt: '2026-11-01T10:00:00Z',
  authorLabel: 'Alex Morgan',
}

describe('Inbox sources and identity boundaries', () => {
  it('recognizes complete plain-text mentions without partial-name or email matches', () => {
    expect(
      mentionsMember('Please @Sam Lee, review.', 'member-2', 'Sam Lee'),
    ).toBe(true)
    expect(mentionsMember('(@[member-2])', 'member-2', 'Sam Lee')).toBe(true)
    expect(mentionsMember('@sam lee!', 'member-2', 'Sam Lee')).toBe(true)
    expect(mentionsMember('@Sam Leeway', 'member-2', 'Sam Lee')).toBe(false)
    expect(mentionsMember('email@Sam Lee', 'member-2', 'Sam Lee')).toBe(false)
    expect(mentionsMember('@@Sam Lee', 'member-2', 'Sam Lee')).toBe(false)
    expect(mentionsMember('@Phụng Lâm?', 'person', 'Phụng Lâm')).toBe(true)
    expect(mentionsMember('@A. Lee', 'person', 'A. Lee')).toBe(true)
  })
  it('limits personal assignments to the known member and omits completed tasks and invented timestamps', () => {
    const items = buildInboxItems(data, [], 'member-2')
    expect(items).toHaveLength(2)
    expect(
      items.every(
        (item) =>
          item.category === 'assignment' && !item.createdAt && !item.actor,
      ),
    ).toBe(true)
    expect(buildInboxItems(data, [], 'member-1')).toEqual([])
    expect(buildInboxItems(data, [], 'unmapped-account')).toEqual([])
  })
  it('classifies real scoped activity, orders newest first and rejects unrelated project/task records', () => {
    const items = buildInboxItems(
      data,
      [
        comment,
        {
          ...comment,
          id: 'update',
          kind: 'event',
          createdAt: '2026-11-01T11:00:00Z',
        },
        { ...comment, id: 'other-project', projectId: 'private-project' },
        { ...comment, id: 'missing-task', taskId: 'FOR-404' },
      ],
      'member-2',
    )
    expect(items.slice(0, 2).map((item) => [item.id, item.category])).toEqual([
      ['activity:update', 'update'],
      ['activity:comment-1', 'mention'],
    ])
    expect(items).toHaveLength(4)
    expect(buildInboxItems(data, [comment], undefined)[0]?.category).toBe(
      'comment',
    )
  })
  it('uses known author identity when another account wrote a mention with the legacy You label', () => {
    const item = buildInboxItems(
      data,
      [{ ...comment, authorId: 'member-1', authorLabel: 'You' }],
      'member-2',
    )[0]
    expect(item?.category).toBe('mention')
    expect(item?.actor).toBe('Alex Morgan')
  })
  it('isolates read state by project and account', () => {
    expect(inboxReadPrefix('a:b', 'c')).not.toBe(inboxReadPrefix('a', 'b:c'))
    expect(inboxReadPrefix(project.id, 'member-1')).not.toBe(
      inboxReadPrefix(project.id, 'member-2'),
    )
  })
  it('keeps self-authored mentions as comments rather than personal mention alerts', () => {
    expect(
      buildInboxItems(
        data,
        [{ ...comment, authorId: 'member-2' }],
        'member-2',
      )[0]?.category,
    ).toBe('comment')
    expect(
      buildInboxItems(data, [{ ...comment, authorLabel: 'You' }], 'member-2')[0]
        ?.category,
    ).toBe('comment')
  })
})
