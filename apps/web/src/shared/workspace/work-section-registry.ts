export type WorkSectionStatus = 'available' | 'implementation'

export type WorkSection = {
  id:
    | 'overview'
    | 'inbox'
    | 'my-tasks'
    | 'projects'
    | 'tasks'
    | 'calendar'
    | 'timeline'
    | 'members'
    | 'teams'
    | 'activity'
  label: string
  description: string
  status: WorkSectionStatus
  counter?: number
}

export const workSections: WorkSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Workspace pulse and priorities',
    status: 'available',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    description: 'Mentions, assignments and updates',
    status: 'available',
    counter: 3,
  },
  {
    id: 'my-tasks',
    label: 'My Tasks',
    description: 'Personal priorities and assignments',
    status: 'available',
    counter: 4,
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Boards, delivery and project execution',
    status: 'available',
    counter: 1,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Cross-project task management',
    status: 'available',
    counter: 4,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Deadlines, events and milestones',
    status: 'available',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Project phases and delivery windows',
    status: 'available',
  },
  {
    id: 'members',
    label: 'Members',
    description: 'People, roles and availability',
    status: 'available',
  },
  {
    id: 'teams',
    label: 'Teams',
    description: 'Functional groups and ownership',
    status: 'available',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Workspace activity and audit context',
    status: 'available',
  },
]

export function getWorkSection(sectionId?: string) {
  const normalizedId = sectionId || 'overview'

  return workSections.find((section) => section.id === normalizedId)
}

export function workSectionPath(sectionId: WorkSection['id']) {
  return `/modules/work/${sectionId}`
}
