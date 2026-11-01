import {
  CalendarIcon,
  CheckSquareIcon,
  ClipboardIcon,
  UserIcon,
  UsersIcon,
} from '@/shared/ui/workspace-icons'

import './customers-surface.css'

const customerStages = [
  {
    id: 'request',
    label: 'Request',
    description: 'Capture customer requests, context, and service expectations.',
    icon: UserIcon,
  },
  {
    id: 'triage',
    label: 'Triage',
    description: 'Classify requests and route internal work to the right owner.',
    icon: ClipboardIcon,
  },
  {
    id: 'delivery-context',
    label: 'Delivery Context',
    description: 'Expose approved milestones and execution context to customers.',
    icon: CalendarIcon,
  },
  {
    id: 'service-visibility',
    label: 'Service Visibility',
    description: 'Present customer-facing status without duplicating internal state.',
    icon: CheckSquareIcon,
  },
  {
    id: 'follow-up',
    label: 'Follow-up',
    description: 'Track handoff, feedback, and the next customer-facing action.',
    icon: UsersIcon,
  },
] as const

const customerCapabilities = [
  {
    eyebrow: 'Customer context',
    title: 'Accounts and service relationships',
    description:
      'The frontend boundary is ready for customer profiles, contacts, service ownership, and relationship context when the customer repository is connected.',
  },
  {
    eyebrow: 'Request visibility',
    title: 'Requests and delivery context',
    description:
      'Customer requests will reference Work and Production records instead of creating a separate project or task system.',
  },
  {
    eyebrow: 'Service visibility',
    title: 'Status and follow-up',
    description:
      'Customer-facing milestones, handoff status, and follow-up remain implementation work until backend customer contracts are available.',
  },
] as const

export function CustomersSurface() {
  return (
    <section
      className="customers-surface"
      aria-label="Customers module foundation"
    >
      <header className="customers-intro">
        <div>
          <p className="eyebrow">Customer operations</p>
          <h2>Customer service flow</h2>
          <p>
            Customers owns account context, requests, service visibility, and
            customer-facing handoff. Work and Production remain the source of
            truth for internal execution, while Documents & Data owns document
            lifecycle state.
          </p>
        </div>
        <span className="customers-foundation-badge">Frontend foundation</span>
      </header>

      <div className="customers-stage-grid">
        {customerStages.map((stage, index) => {
          const StageIcon = stage.icon

          return (
            <article className="customers-stage-card" key={stage.id}>
              <div className="customers-stage-heading">
                <span className="customers-stage-icon" aria-hidden="true">
                  <StageIcon />
                </span>
                <span className="customers-stage-index">
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

      <div className="customers-capability-grid">
        {customerCapabilities.map((capability) => (
          <article
            className="customers-capability-card"
            key={capability.title}
          >
            <p className="eyebrow">{capability.eyebrow}</p>
            <h3>{capability.title}</h3>
            <p>{capability.description}</p>
          </article>
        ))}
      </div>

      <section className="customers-boundary-card">
        <p className="eyebrow">Domain boundary</p>
        <h3>Customer context, not duplicate internal execution</h3>
        <p>
          Customers will reference Work projects/tasks, Production jobs, and
          Documents & Data records through stable contracts. It will not create
          parallel project, queue, or document models for customer-facing views.
        </p>
      </section>
    </section>
  )
}
