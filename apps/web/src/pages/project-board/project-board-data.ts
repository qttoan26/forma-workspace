import { projectTasksSchema } from './project-tasks-schema'
import { projectWorkspaceSchema } from './project-workspace-schema'
import { taskAssigneesSchema } from './task-assignees-schema'
import { demoMembers } from '@/shared/demo/demo-members'

const projectWorkspace = projectWorkspaceSchema.parse({
  workspace: {
    id: 'ws-1',
    name: 'Forma',
    slug: 'forma',
  },
  project: {
    id: 'project-1',
    workspaceId: 'ws-1',
    name: 'Avengers Initiative',
    key: 'FOR',
    description:
      'Coordinate Avengers missions, research, intelligence and field readiness.',
  },
})

export const { workspace, project } = projectWorkspace

const projectTasks = projectTasksSchema.parse({
  project,
  tasks: [
    {
      id: 'FOR-12',
      projectId: project.id,
      title: 'Map Bifrost evacuation routes',
      description:
        'Thor: map safe evacuation routes between Earth and Asgard before the next field mission.',
      status: 'backlog',
      priority: 'medium',
      assigneeId: 'member-3',
    },
    {
      id: 'FOR-18',
      projectId: project.id,
      title: 'Upgrade the Mark LXXXV armor',
      description:
        'Iron Man: improve armor diagnostics, nanotech recovery and flight-system reliability.',
      status: 'todo',
      priority: 'high',
      assigneeId: 'member-2',
      dueDate: '2026-10-29',
    },
    {
      id: 'FOR-21',
      projectId: project.id,
      title: 'Deploy the Ultron defense firewall',
      description:
        'Iron Man: harden the Avengers network and validate the defense firewall with FRIDAY.',
      status: 'in-progress',
      priority: 'urgent',
      assigneeId: 'member-2',
      dueDate: '2026-10-27',
    },
    {
      id: 'FOR-07',
      projectId: project.id,
      title: 'Approve the Avengers response protocol',
      description:
        'Captain America: approve squad coordination, civilian protection and emergency response procedures.',
      status: 'done',
      priority: 'low',
      assigneeId: 'member-1',
    },
    {
      id: 'FOR-22',
      projectId: project.id,
      title: 'Assemble the field response squad',
      description:
        'Captain America: assign field roles and brief the squad on the next mission.',
      status: 'todo',
      priority: 'high',
      assigneeId: 'member-1',
      dueDate: '2026-11-04',
    },
    {
      id: 'FOR-23',
      projectId: project.id,
      title: 'Inspect Stormbreaker before deployment',
      description:
        'Thor: verify Stormbreaker readiness and run a controlled lightning-energy check.',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'member-3',
      dueDate: '2026-11-05',
    },
    {
      id: 'FOR-24',
      projectId: project.id,
      title: 'Stabilize the gamma containment chamber',
      description:
        'Hulk: review containment thresholds and test emergency shutdown controls in the lab.',
      status: 'backlog',
      priority: 'high',
      assigneeId: 'member-4',
      dueDate: '2026-11-06',
    },
    {
      id: 'FOR-25',
      projectId: project.id,
      title: 'Analyze gamma radiation signatures',
      description:
        'Bruce Banner: compare gamma signatures from the latest field samples and prepare a research summary.',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'member-4',
      dueDate: '2026-11-07',
    },
    {
      id: 'FOR-26',
      projectId: project.id,
      title: 'Review HYDRA intelligence reports',
      description:
        'Black Widow: cross-check intelligence sources and flag information gaps for the field team.',
      status: 'todo',
      priority: 'high',
      assigneeId: 'member-5',
      dueDate: '2026-11-03',
    },
    {
      id: 'FOR-27',
      projectId: project.id,
      title: 'Prepare the undercover mission briefing',
      description:
        'Black Widow: prepare cover identities, communication checks and extraction options.',
      status: 'backlog',
      priority: 'medium',
      assigneeId: 'member-5',
    },
    {
      id: 'FOR-28',
      projectId: project.id,
      title: 'Calibrate the tactical arrow loadout',
      description:
        'Hawkeye: inspect tracking, rescue and non-lethal arrow configurations for squad support.',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'member-6',
      dueDate: '2026-11-04',
    },
    {
      id: 'FOR-29',
      projectId: project.id,
      title: 'Scout civilian evacuation checkpoints',
      description:
        'Hawkeye: confirm observation points and mark safe civilian evacuation checkpoints.',
      status: 'backlog',
      priority: 'high',
      assigneeId: 'member-6',
      dueDate: '2026-11-08',
    },
  ],
})

const taskAssignees = taskAssigneesSchema.parse({
  members: demoMembers,
  tasks: projectTasks.tasks,
})

export const { members } = taskAssignees
export const initialTasks = taskAssignees.tasks
