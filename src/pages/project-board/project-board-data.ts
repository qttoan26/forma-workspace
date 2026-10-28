import type { Member } from '@/entities/member/model/member'

import { projectTasksSchema } from './project-tasks-schema'
import { projectWorkspaceSchema } from './project-workspace-schema'

const projectWorkspace = projectWorkspaceSchema.parse({
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
    description: 'Ship the first production-ready Forma Workspace experience.',
  },
})

export const { workspace, project } = projectWorkspace

export const members: Member[] = [
  { id: 'member-1', name: 'Alex Morgan', initials: 'AM', role: 'Design' },
  { id: 'member-2', name: 'Sam Lee', initials: 'SL', role: 'Frontend' },
  { id: 'member-3', name: 'Jordan Kim', initials: 'JK', role: 'Product' },
]

const projectTasks = projectTasksSchema.parse({
  project,
  tasks: [
    {
      id: 'FOR-12',
      projectId: project.id,
      title: 'Define workspace navigation',
      status: 'backlog',
      priority: 'medium',
      assigneeId: 'member-3',
    },
    {
      id: 'FOR-18',
      projectId: project.id,
      title: 'Create board interaction model',
      status: 'todo',
      priority: 'high',
      assigneeId: 'member-2',
      dueDate: '2026-10-29',
    },
    {
      id: 'FOR-21',
      projectId: project.id,
      title: 'Build accessible task cards',
      status: 'in-progress',
      priority: 'urgent',
      assigneeId: 'member-2',
      dueDate: '2026-10-27',
    },
    {
      id: 'FOR-07',
      projectId: project.id,
      title: 'Document product principles',
      status: 'done',
      priority: 'low',
      assigneeId: 'member-1',
    },
  ],
})

export const initialTasks = projectTasks.tasks
