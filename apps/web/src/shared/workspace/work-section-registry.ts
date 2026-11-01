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
    status: 'implementation',
  },
  {
    id: 'my-tasks',
    label: 'My Tasks',
    description: 'Personal priorities and assignments',
    status: 'available',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Boards, delivery and project execution',
    status: 'available',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Tasks in the current project',
    status: 'available',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Task due dates and upcoming deadlines',
    status: 'available',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Tasks ordered by delivery date',
    status: 'available',
  },
  {
    id: 'members',
    label: 'Project members',
    description: 'People assigned to the current project',
    status: 'available',
  },
  {
    id: 'teams',
    label: 'Teams',
    description: 'Functional groups and ownership',
    status: 'implementation',
  },
  {
    id: 'activity',
    label: 'Activity',
    description:
      'Saved comments and task detail updates in the current project',
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
