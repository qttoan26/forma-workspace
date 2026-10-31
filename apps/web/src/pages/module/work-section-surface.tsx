import type { ReactNode } from 'react'

import type { WorkSection } from '@/shared/workspace/work-section-registry'

import './work-section-surface.css'

const appBaseUrl = import.meta.env.BASE_URL
const projectHref = `${appBaseUrl}workspaces/forma/projects/project-1`

const tasks = [
  {
    key: 'FOR-101',
    title: 'Define workspace navigation',
    project: 'Forma Workspace',
    assignee: 'SL',
    due: 'Today',
    status: 'In progress',
    priority: 'High',
  },
  {
    key: 'FOR-102',
    title: 'Connect project board persistence',
    project: 'Forma Workspace',
    assignee: 'MN',
    due: 'Nov 2',
    status: 'Review',
    priority: 'Medium',
  },
  {
    key: 'FOR-103',
    title: 'Document frontend module boundaries',
    project: 'Forma Workspace',
    assignee: 'SL',
    due: 'Nov 4',
    status: 'Todo',
    priority: 'Medium',
  },
  {
    key: 'FOR-104',
    title: 'Prepare production queue UX',
    project: 'Production',
    assignee: 'AK',
    due: 'Nov 6',
    status: 'Todo',
    priority: 'Low',
  },
]

const inboxItems = [
  {
    title: 'You were assigned FOR-101',
    detail: 'Define workspace navigation',
    meta: '2 minutes ago · Forma Workspace',
    unread: true,
  },
  {
    title: 'Mina mentioned you in FOR-102',
    detail: 'Can you review the persistence boundary before merge?',
    meta: '38 minutes ago · Project board',
    unread: true,
  },
  {
    title: 'Project status changed to On track',
    detail: 'Forma Workspace · Frontend foundation',
    meta: 'Yesterday · System activity',
    unread: false,
  },
]

const members = [
  ['SL', 'Sam Lee', 'Frontend', 'Available'],
  ['MN', 'Mina Nguyen', 'Product', 'In focus'],
  ['AK', 'Alex Kim', 'Operations', 'Available'],
  ['JD', 'Jordan Diaz', 'Platform', 'Away'],
] as const

const teams = [
  ['Software', '4 members', 'Frontend, Backend, DevOps'],
  ['Production', '18 members', 'Scan, OCR, Data entry, QC'],
  ['Operations', '6 members', 'Delivery, Vendor, Customer ops'],
  ['Policy', '3 members', 'SOP, Legal, Compliance'],
] as const

const activities = [
  ['Sam Lee', 'moved FOR-101 to In progress', '8 min ago'],
  ['Mina Nguyen', 'updated project status to On track', '43 min ago'],
  ['Alex Kim', 'created production UX notes', '2 hr ago'],
  ['Jordan Diaz', 'updated API authentication tests', 'Yesterday'],
] as const

function SurfaceHeader({ section }: { section: WorkSection }) {
  return (
    <header className="work-surface-header">
      <div>
        <p className="eyebrow">Work · {section.label}</p>
        <h2 id="work-surface-title">{section.label}</h2>
        <p>{section.description}</p>
      </div>
      <span className="work-surface-foundation">Frontend foundation</span>
    </header>
  )
}

function TaskTable({ onlyMine = false }: { onlyMine?: boolean }) {
  const visibleTasks = onlyMine
    ? tasks.filter((task) => task.assignee === 'SL')
    : tasks

  return (
    <div className="work-data-table" role="table" aria-label="Tasks">
      <div className="work-data-table-row is-header" role="row">
        <span role="columnheader">Task</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Due</span>
        <span role="columnheader">Owner</span>
      </div>
      {visibleTasks.map((task) => (
        <div className="work-data-table-row" role="row" key={task.key}>
          <span className="work-task-main" role="cell">
            <small>{task.key}</small>
            <strong>{task.title}</strong>
            <em>{task.project}</em>
          </span>
          <span role="cell">
            <span className="work-status-chip">{task.status}</span>
          </span>
          <span role="cell">{task.due}</span>
          <span role="cell">
            <span
              className="work-mini-avatar"
              aria-label={`Owner ${task.assignee}`}
            >
              {task.assignee}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

function OverviewSurface() {
  return (
    <div className="work-surface-grid">
      <section className="work-metric-grid" aria-label="Workspace metrics">
        <article>
          <small>Open tasks</small>
          <strong>4</strong>
          <span>2 assigned to you</span>
        </article>
        <article>
          <small>Active projects</small>
          <strong>1</strong>
          <span>On track</span>
        </article>
        <article>
          <small>Inbox</small>
          <strong>3</strong>
          <span>2 unread updates</span>
        </article>
        <article>
          <small>Team members</small>
          <strong>4</strong>
          <span>3 available now</span>
        </article>
      </section>

      <div className="work-surface-columns">
        <section className="work-panel">
          <div className="work-panel-heading">
            <div>
              <small>My work</small>
              <h3>Priority tasks</h3>
            </div>
            <span>Today</span>
          </div>
          <TaskTable onlyMine />
        </section>

        <section className="work-panel">
          <div className="work-panel-heading">
            <div>
              <small>Project pulse</small>
              <h3>Forma Workspace</h3>
            </div>
            <span className="work-health">On track</span>
          </div>
          <div className="work-project-progress">
            <div>
              <span>Frontend foundation</span>
              <strong>72%</strong>
            </div>
            <progress max="100" value="72">
              72%
            </progress>
          </div>
          <div className="work-project-links">
            <a href={projectHref}>Open project board</a>
            <span>Board · List · Table · Calendar · Timeline · Files</span>
          </div>
        </section>
      </div>
    </div>
  )
}

function InboxSurface() {
  return (
    <section className="work-panel work-inbox-panel">
      <div className="work-panel-heading">
        <div>
          <small>Attention queue</small>
          <h3>Recent updates</h3>
        </div>
        <button type="button" className="work-quiet-button">
          Mark all read
        </button>
      </div>
      <div className="work-inbox-list">
        {inboxItems.map((item) => (
          <article
            className={`work-inbox-item${item.unread ? ' is-unread' : ''}`}
            key={item.title}
          >
            <span className="work-inbox-dot" aria-hidden="true" />
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <small>{item.meta}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectsSurface() {
  return (
    <section className="work-panel">
      <div className="work-panel-heading">
        <div>
          <small>Projects</small>
          <h3>Active workspaces</h3>
        </div>
        <span>1 active</span>
      </div>
      <article className="work-project-row">
        <span className="work-project-mark">FOR</span>
        <div className="work-project-row-main">
          <strong>Forma Workspace</strong>
          <span>Internal operating platform · Frontend foundation</span>
          <div className="work-project-tags">
            <span>Board</span>
            <span>List</span>
            <span>Table</span>
            <span>Calendar</span>
            <span>Timeline</span>
            <span>Files</span>
          </div>
        </div>
        <div className="work-project-row-meta">
          <span className="work-health">On track</span>
          <a href={projectHref}>Open</a>
        </div>
      </article>
    </section>
  )
}

function CalendarSurface() {
  const agenda = [
    ['Today', 'Review workspace navigation', '10:30'],
    ['Nov 2', 'Project board persistence review', '14:00'],
    ['Nov 4', 'Frontend architecture checkpoint', '09:00'],
    ['Nov 6', 'Production module UX review', '15:30'],
  ] as const

  return (
    <section className="work-panel">
      <div className="work-panel-heading">
        <div>
          <small>Calendar</small>
          <h3>Upcoming schedule</h3>
        </div>
        <span>4 items</span>
      </div>
      <div className="work-agenda-list">
        {agenda.map(([date, title, time]) => (
          <article key={`${date}-${title}`}>
            <span>{date}</span>
            <strong>{title}</strong>
            <small>{time}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function TimelineSurface() {
  const lanes = [
    ['Navigation shell', 'Oct 28', 'Oct 31', 'Done'],
    ['Work module surfaces', 'Oct 31', 'Nov 3', 'In progress'],
    ['Project views', 'Nov 3', 'Nov 8', 'Planned'],
    ['Production foundation', 'Nov 8', 'Nov 14', 'Planned'],
  ] as const

  return (
    <section className="work-panel">
      <div className="work-panel-heading">
        <div>
          <small>Timeline</small>
          <h3>Delivery plan</h3>
        </div>
        <span>Frontend</span>
      </div>
      <div className="work-timeline-list">
        {lanes.map(([name, start, end, status]) => (
          <article key={name}>
            <div>
              <strong>{name}</strong>
              <small>
                {start} → {end}
              </small>
            </div>
            <span>{status}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function MembersSurface({ teams: showTeams = false }: { teams?: boolean }) {
  if (showTeams) {
    return (
      <div className="work-team-grid">
        {teams.map(([name, count, detail]) => (
          <article className="work-person-card" key={name}>
            <span className="work-team-mark">
              {name.slice(0, 2).toUpperCase()}
            </span>
            <strong>{name}</strong>
            <small>{count}</small>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="work-team-grid">
      {members.map(([initials, name, role, state]) => (
        <article className="work-person-card" key={name}>
          <span className="work-person-avatar">{initials}</span>
          <strong>{name}</strong>
          <small>{role}</small>
          <p>{state}</p>
        </article>
      ))}
    </div>
  )
}

function ActivitySurface() {
  return (
    <section className="work-panel">
      <div className="work-panel-heading">
        <div>
          <small>Activity</small>
          <h3>Workspace stream</h3>
        </div>
        <span>Live context</span>
      </div>
      <div className="work-activity-list">
        {activities.map(([person, action, time]) => (
          <article key={`${person}-${action}`}>
            <span className="work-activity-rail" aria-hidden="true" />
            <div>
              <strong>{person}</strong>
              <p>{action}</p>
              <small>{time}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function WorkSectionSurface({ section }: { section: WorkSection }) {
  let content: ReactNode

  switch (section.id) {
    case 'overview':
      content = <OverviewSurface />
      break
    case 'inbox':
      content = <InboxSurface />
      break
    case 'my-tasks':
      content = <TaskTable onlyMine />
      break
    case 'projects':
      content = <ProjectsSurface />
      break
    case 'tasks':
      content = <TaskTable />
      break
    case 'calendar':
      content = <CalendarSurface />
      break
    case 'timeline':
      content = <TimelineSurface />
      break
    case 'members':
      content = <MembersSurface />
      break
    case 'teams':
      content = <MembersSurface teams />
      break
    case 'activity':
      content = <ActivitySurface />
      break
  }

  return (
    <section className="work-surface" aria-labelledby="work-surface-title">
      <SurfaceHeader section={section} />
      {content}
    </section>
  )
}
