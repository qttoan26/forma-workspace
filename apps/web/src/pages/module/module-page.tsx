import { WorkSectionSurface } from '@/pages/module/work-section-surface'
import { getWorkspaceModule } from '@/shared/workspace/module-registry'
import {
  getModuleSections,
  moduleSectionPath,
  type ModuleSection,
} from '@/shared/workspace/module-section-registry'
import { getWorkSection } from '@/shared/workspace/work-section-registry'
import { WorkspaceShell } from '@/widgets/workspace-shell/workspace-shell'

import './module-page.css'

const appBaseUrl = import.meta.env.BASE_URL

export function ModulePage({
  moduleId,
  sectionId,
}: {
  moduleId: string
  sectionId?: string | undefined
}) {
  const module = getWorkspaceModule(moduleId)
  const sections = getModuleSections(moduleId)
  const selected: ModuleSection | undefined =
    moduleId === 'work'
      ? getWorkSection(sectionId)
      : sections.find((section) => section.id === sectionId)
  const invalidSection = Boolean(sectionId && !selected)

  if (!module || invalidSection)
    return (
      <WorkspaceShell
        activeModuleId={module?.id}
        pageLabel={invalidSection ? 'Section not found' : 'Module not found'}
      >
        <section className="module-page-content">
          <section className="module-state-card">
            <h1>{invalidSection ? 'Section not found' : 'Module not found'}</h1>
            <p>
              The requested {invalidSection ? 'section' : 'module'} is not
              available.
            </p>
            <a
              className="module-primary-action"
              href={
                module ? `${appBaseUrl}${module.path.slice(1)}` : appBaseUrl
              }
            >
              {module
                ? `Back to ${module.label}`
                : 'Back to workspace overview'}
            </a>
          </section>
        </section>
      </WorkspaceShell>
    )

  const workSection =
    module.id === 'work' ? getWorkSection(sectionId) : undefined
  const status = selected?.status ?? module.status

  return (
    <WorkspaceShell
      activeModuleId={module.id}
      activeSectionId={selected?.id}
      pageLabel={
        selected ? `${module.label} / ${selected.label}` : module.label
      }
    >
      <section className="module-page-content" aria-labelledby="module-title">
        <nav className="module-breadcrumb" aria-label="Breadcrumb">
          <a href={appBaseUrl}>Workspace</a>
          <span aria-hidden="true">/</span>
          {selected ? (
            <>
              <a href={`${appBaseUrl}${module.path.slice(1)}`}>
                {module.label}
              </a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{selected.label}</span>
            </>
          ) : (
            <span aria-current="page">{module.label}</span>
          )}
        </nav>
        <header className="module-page-header">
          <div>
            <p className="eyebrow">{module.label}</p>
            <h1 id="module-title">{selected?.label ?? module.label}</h1>
            <p>{selected?.description ?? module.description}</p>
          </div>
          <span className={`module-status module-status-${status}`}>
            {status === 'available'
              ? 'Available'
              : 'Implementation in progress'}
          </span>
        </header>
        {workSection ? (
          <WorkSectionSurface section={workSection} />
        ) : selected ? (
          <section
            className="module-state-card"
            aria-label={`${selected.label} implementation status`}
          >
            <h2>{selected.label}</h2>
            <p>This area is being completed.</p>
            <ul className="module-detail-scope">
              {selected.scope?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>Implementation in progress</p>
          </section>
        ) : (
          <section
            className="module-section-grid"
            aria-label={`${module.label} areas`}
          >
            {sections.map((section) => (
              <a
                className="module-section-card"
                key={section.id}
                href={`${appBaseUrl}${moduleSectionPath(module.id, section.id).slice(1)}`}
              >
                <strong>
                  {section.label}
                  <span aria-hidden="true">↗</span>
                </strong>
                <p>{section.description}</p>
                <small>Implementation in progress</small>
              </a>
            ))}
          </section>
        )}
      </section>
    </WorkspaceShell>
  )
}
