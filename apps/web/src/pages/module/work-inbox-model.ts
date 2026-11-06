import type { TaskActivityEntry } from '@/entities/task/model/task-activity'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'

export const inboxCategories = [
  ['all', 'All'],
  ['mention', 'Mentions'],
  ['assignment', 'Assignments'],
  ['comment', 'Comments'],
  ['update', 'Updates'],
] as const

export type InboxCategory = (typeof inboxCategories)[number][0]
export type InboxItem = {
  id: string
  taskId: string
  category: Exclude<InboxCategory, 'all'>
  actor: string
  action: string
  snippet: string
  createdAt?: string
}

/** Plain-text mentions use the complete current member name or @[member-id]. */
export function mentionsMember(body: string, id: string, name: string) {
  return [name, `[${id}]`].some((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(
      `(?:^|[^\\p{L}\\p{N}_@])@${escaped}(?=$|[^\\p{L}\\p{N}_-])`,
      'iu',
    ).test(body)
  })
}

/** Use saved events and current assignments; never invent an assignment actor/date. */
export function buildInboxItems(
  data: ProjectBoardData,
  entries: TaskActivityEntry[],
  userId: string | undefined,
): InboxItem[] {
  const member = data.members.find((person) => person.id === userId)
  const tasks = new Set(data.initialTasks.map((task) => task.id))
  const activity: InboxItem[] = entries
    .filter(
      (entry) => entry.projectId === data.project.id && tasks.has(entry.taskId),
    )
    .map<InboxItem>((entry) => {
      const mention =
        entry.kind === 'comment' &&
        member &&
        (entry.authorId
          ? entry.authorId !== member.id
          : entry.authorLabel !== 'You') &&
        mentionsMember(entry.body, member.id, member.name)
      return {
        id: `activity:${entry.id}`,
        taskId: entry.taskId,
        category:
          entry.kind === 'event' ? 'update' : mention ? 'mention' : 'comment',
        actor: inboxActor(entry, data, userId),
        action:
          entry.kind === 'event'
            ? 'updated'
            : mention
              ? 'mentioned you in'
              : 'commented on',
        snippet: entry.body,
        createdAt: entry.createdAt,
      }
    })
    .sort(
      (a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '') ||
        a.id.localeCompare(b.id),
    )

  const assignments: InboxItem[] = member
    ? data.initialTasks
        .filter(
          (task) => task.assigneeId === member.id && task.status !== 'done',
        )
        .map((task) => ({
          id: `assignment:${member.id}:${task.id}`,
          taskId: task.id,
          category: 'assignment',
          actor: '',
          action: 'Assigned to you',
          snippet: `${task.priority} priority${task.dueDate ? ` · Due ${task.dueDate}` : ' · No due date'}`,
        }))
    : []
  return [...activity, ...assignments]
}

export function inboxReadPrefix(projectId: string, userId?: string) {
  return `forma-workspace:inbox-read:v1:${encodeURIComponent(projectId)}:${encodeURIComponent(userId ?? 'unlinked')}:`
}

export function inboxActor(
  entry: TaskActivityEntry,
  data: ProjectBoardData,
  userId?: string,
) {
  if (entry.authorId && entry.authorId === userId) return 'You'
  return (
    data.members.find((member) => member.id === entry.authorId)?.name ??
    entry.authorLabel ??
    'Task activity'
  )
}
