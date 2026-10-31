import type { ComponentType, SVGProps } from 'react'

import { WorkSectionSurface } from '@/pages/module/work-section-surface'
import {
  BellIcon,
  CalendarIcon,
  CheckSquareIcon,
  ClipboardIcon,
  FolderIcon,
  HomeIcon,
  SparkIcon,
  UserIcon,
  UsersIcon,
} from '@/shared/ui/workspace-icons'
import { getWorkspaceModule } from '@/shared/workspace/module-registry'
import {
  getWorkSection,
  workSectionPath,
  workSections,
} from '@/shared/workspace/work-section-registry'
import { WorkspaceShell } from '@/widgets/workspace-shell/workspace-shell'

import './module-page.css'

const appBaseUrl = import.meta.env.BASE_URL

type WorkspaceIcon = ComponentType<SVGProps<SVGSVGElement>>

const workSectionIcons: Record<string, WorkspaceIcon> = {
  overview: HomeIcon,
  inbox: BellIcon,
  'my-tasks': UserIcon,
  projects: FolderIcon,
  tasks: CheckSquareIcon,
  calendar: CalendarIcon,
  timeline: ClipboardIcon,
  members: UsersIcon,
  teams: UsersIcon,
  activity: SparkIcon,
}

function hrefFor(path: string) {
  return `${appBaseUrl}${path.replace(/^\//, '')}`
}

export function ModulePage({
  moduleId,
  sectionId,
}: {
  moduleId: string
  sectionId?: string | undefined
}) {
  const module = getWorkspaceModule(moduleId)

  if (!module) {
    return (
      <WorkspaceShell pageLabel="Module not found">
        <section className="module-page-content">
          <section className="module-state-card">
            <p className="eyebrow">Forma Workspace</p>
            <h1>Module not found</h1>
            <p>The requested workspace module is not available.</p>
            <a className="module-primary-action" href={appBaseUrl}>
              Back to workspace overview
            </a>
          </section>
        </section>
      </WorkspaceShell>
    )
  }

  const isWorkModule = module.id === 'work'
  const workSection = isWorkModule ? getWorkSection(sectionId) : undefined

  return (
    <WorkspaceShell
      activeModuleId={module.id}
      activeSectionId={workSection?.id}
      pageLabel={
        workSection ? `${module.label} / ${workSection.label}` : module.label
      }
    >
      <section className="module-page-content" aria-labelledby="module-title">
        <header className="module-page-header">
          <div>
            <p className="eyebrow">{module.eyebrow}</p>
            <h1 id="module-title">{module.label}</h1>
            <p>{module.description}</p>
          </div>
          <span className={`module-status module-status-${module.status}`}>
            {module.status === 'available'
              ? 'Frontend foundation available'
              : 'Implementation in progress'}
          </span>
        </header>

        {isWorkModule && workSection ? (
          <div className="work-module-layout">
            <aside className="work-subnav" aria-label="Work sections">
              <div className="work-subnav-heading">
                <span>Work</span>
                <small>Execution</small>
              </div>
              <nav className="work-subnav-list">
                {workSections.map((section) => {
                  const SectionIcon =
                    workSectionIcons[section.id] ?? ClipboardIcon
                  const active = section.id === workSection.id

                  return (
                    <a
                      className={`work-subnav-item${active ? ' is-active' : ''}`}
                      href={hrefFor(workSectionPath(section.id))}
                      key={section.id}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="work-subnav-icon" aria-hidden="true">
                        <SectionIcon />
                      </span>
                      <span className="work-subnav-copy">
                        <strong>{section.label}</strong>
                        <small>{section.description}</small>
                      </span>
                      {section.counter ? (
                        <span className="work-subnav-count">
                          {section.counter}
                        </span>
                      ) : null}
                    </a>
                  )
                })}
              </nav>
            </aside>

            <div className="work-module-main">
              <WorkSectionSurface section={workSection} />
            </div>
          </div>
        ) : (
          <section
            className="module-state-card"
            aria-label={`${module.label} implementation status`}
          >
            <p className="eyebrow">Implementation status</p>
            <h2>This module is being completed.</h2>
            <p>
              Navigation and module boundaries are in place first. Detailed
              workflows, screens, permissions, and backend integration will be
              implemented incrementally without changing the workspace
              structure.
            </p>
          </section>
        )}
      </section>
    </WorkspaceShell>
  )
}
