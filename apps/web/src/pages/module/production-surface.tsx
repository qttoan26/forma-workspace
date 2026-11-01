import {
  CalendarIcon,
  CheckSquareIcon,
  ClipboardIcon,
  FactoryIcon,
  UsersIcon,
} from '@/shared/ui/workspace-icons'

import './production-surface.css'

const productionStages = [
  {
    id: 'intake',
    label: 'Job Intake',
    description: 'Receive approved work packages and production requirements.',
    icon: ClipboardIcon,
  },
  {
    id: 'queue',
    label: 'Queue',
    description:
      'Prioritize batches and assign work to the right operating team.',
    icon: FactoryIcon,
  },
  {
    id: 'processing',
    label: 'Processing',
    description: 'Track active execution stages and operational ownership.',
    icon: UsersIcon,
  },
  {
    id: 'quality',
    label: 'Quality Control',
    description: 'Capture review status, exceptions, and rework before release.',
    icon: CheckSquareIcon,
  },
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'Expose release readiness, due dates, and downstream handoff.',
    icon: CalendarIcon,
  },
] as const

const visibilityCards = [
  {
    eyebrow: 'Queue visibility',
    title: 'Production queues',
    description:
      'The frontend boundary is ready for queue priority, owner, SLA, and batch status when the production repository is connected.',
  },
  {
    eyebrow: 'Capacity visibility',
    title: 'Workload and ownership',
    description:
      'Team load, assignments, and capacity remain implementation work until production data is available from the backend.',
  },
  {
    eyebrow: 'Delivery visibility',
    title: 'Milestones and handoff',
    description:
      'Delivery readiness will connect to customer and vendor-facing workflows without duplicating their domain data.',
  },
] as const

export function ProductionSurface() {
  return (
    <section
      className="production-surface"
      aria-label="Production module foundation"
    >
      <header className="production-intro">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Production flow</h2>
          <p>
            Production owns execution queues, stage progress, workload, quality,
            and delivery readiness. Work coordinates cross-team tasks, while
            Production remains the operational source of truth for processing.
          </p>
        </div>
        <span className="production-foundation-badge">
          Frontend foundation
        </span>
      </header>

      <div className="production-stage-grid">
        {productionStages.map((stage, index) => {
          const StageIcon = stage.icon

          return (
            <article className="production-stage-card" key={stage.id}>
              <div className="production-stage-heading">
                <span className="production-stage-icon" aria-hidden="true">
                  <StageIcon />
                </span>
                <span className="production-stage-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <strong>{stage.label}</strong>
              <p>{stage.description}</p>
              <small>Implementation in progress</small>
            </article>
          )
        })}
      </div>

      <div className="production-visibility-grid">
        {visibilityCards.map((card) => (
          <article className="production-visibility-card" key={card.title}>
            <p className="eyebrow">{card.eyebrow}</p>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <section className="production-boundary-card">
        <p className="eyebrow">Domain boundary</p>
        <h3>No duplicate project or document system</h3>
        <p>
          Production will reference Work projects/tasks and Documents & Data
          records where needed. It will not recreate those models or simulate
          backend production events in the browser.
        </p>
      </section>
    </section>
  )
}
