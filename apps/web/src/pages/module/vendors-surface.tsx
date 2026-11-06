import {
  CalendarIcon,
  CheckSquareIcon,
  ClipboardIcon,
  ShieldIcon,
  UsersIcon,
} from '@/shared/ui/workspace-icons'

import './vendors-surface.css'

const vendorStages = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    description: 'Register vendor context, ownership, and service scope.',
    icon: UsersIcon,
  },
  {
    id: 'assignment',
    label: 'Assignment',
    description: 'Route approved outsourced work packages to the right vendor.',
    icon: ClipboardIcon,
  },
  {
    id: 'execution',
    label: 'Execution',
    description:
      'Track external work status without duplicating Production state.',
    icon: CheckSquareIcon,
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Validate quality, exceptions, and acceptance before handoff.',
    icon: ShieldIcon,
  },
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'Expose due dates, completion status, and downstream handoff.',
    icon: CalendarIcon,
  },
] as const

const vendorCapabilities = [
  {
    eyebrow: 'Vendor directory',
    title: 'Partners and service scope',
    description:
      'The frontend boundary is ready for vendor profiles, contacts, capabilities, service regions, and ownership when the vendor repository is connected.',
  },
  {
    eyebrow: 'External execution',
    title: 'Assignments and progress',
    description:
      'Vendor assignments will reference Work and Production records instead of creating a second task or queue system.',
  },
  {
    eyebrow: 'Delivery visibility',
    title: 'Acceptance and handoff',
    description:
      'Delivery status, quality review, and acceptance remain implementation work until backend vendor contracts are available.',
  },
] as const

export function VendorsSurface() {
  return (
    <section className="vendors-surface" aria-label="Vendors module foundation">
      <header className="vendors-intro">
        <div>
          <p className="eyebrow">External operations</p>
          <h2>Vendor collaboration flow</h2>
          <p>
            Vendors owns partner profiles, outsourced assignments, external
            progress, acceptance, and delivery visibility. Work and Production
            remain the source of truth for internal execution records.
          </p>
        </div>
        <span className="vendors-foundation-badge">Frontend foundation</span>
      </header>

      <div className="vendors-stage-grid">
        {vendorStages.map((stage, index) => {
          const StageIcon = stage.icon

          return (
            <article className="vendors-stage-card" key={stage.id}>
              <div className="vendors-stage-heading">
                <span className="vendors-stage-icon" aria-hidden="true">
                  <StageIcon />
                </span>
                <span className="vendors-stage-index">
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

      <div className="vendors-capability-grid">
        {vendorCapabilities.map((capability) => (
          <article className="vendors-capability-card" key={capability.title}>
            <p className="eyebrow">{capability.eyebrow}</p>
            <h3>{capability.title}</h3>
            <p>{capability.description}</p>
          </article>
        ))}
      </div>

      <section className="vendors-boundary-card">
        <p className="eyebrow">Domain boundary</p>
        <h3>Vendor and internal records</h3>
        <p>
          Work projects and tasks, Production jobs, and Documents & Data records
          stay in their respective modules. Vendor deliveries will show
          milestones explicitly shared for a linked assignment.
        </p>
      </section>
    </section>
  )
}
