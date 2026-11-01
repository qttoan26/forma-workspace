import {
  CheckSquareIcon,
  ClipboardIcon,
  SettingsIcon,
  SparkIcon,
  UsersIcon,
} from '@/shared/ui/workspace-icons'

import './automation-surface.css'

const automationStages = [
  {
    id: 'trigger',
    label: 'Trigger',
    description: 'Start workflows from events, schedules, or manual actions.',
    icon: SparkIcon,
  },
  {
    id: 'conditions',
    label: 'Conditions',
    description: 'Evaluate routing rules, ownership, and required context.',
    icon: SettingsIcon,
  },
  {
    id: 'actions',
    label: 'Actions',
    description:
      'Coordinate approved operations across Forma module boundaries.',
    icon: ClipboardIcon,
  },
  {
    id: 'approval',
    label: 'Approval',
    description: 'Pause for governed decisions where human review is required.',
    icon: UsersIcon,
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    description: 'Track workflow state, failures, retries, and audit context.',
    icon: CheckSquareIcon,
  },
] as const

const automationCapabilities = [
  {
    eyebrow: 'Reusable workflows',
    title: 'Workflow definitions',
    description:
      'The frontend boundary is ready for named workflows, versions, ownership, and activation state once a workflow repository is connected.',
  },
  {
    eyebrow: 'Governed execution',
    title: 'Approvals and controls',
    description:
      'Approval gates will reference Policy & Compliance rules instead of duplicating governance logic inside Automation.',
  },
  {
    eyebrow: 'Operational visibility',
    title: 'Runs and monitoring',
    description:
      'Run history, failures, retries, and execution metrics remain implementation work until backend execution data is available.',
  },
] as const

export function AutomationSurface() {
  return (
    <section
      className="automation-surface"
      aria-label="Automation module foundation"
    >
      <header className="automation-intro">
        <div>
          <p className="eyebrow">Workflow orchestration</p>
          <h2>Automation flow</h2>
          <p>
            Automation coordinates reusable triggers, conditions, actions,
            approvals, and monitoring across Forma. Each business module remains
            the source of truth for its own data and lifecycle state.
          </p>
        </div>
        <span className="automation-foundation-badge">Frontend foundation</span>
      </header>

      <div className="automation-stage-grid">
        {automationStages.map((stage, index) => {
          const StageIcon = stage.icon

          return (
            <article className="automation-stage-card" key={stage.id}>
              <div className="automation-stage-heading">
                <span className="automation-stage-icon" aria-hidden="true">
                  <StageIcon />
                </span>
                <span className="automation-stage-index">
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

      <div className="automation-capability-grid">
        {automationCapabilities.map((capability) => (
          <article className="automation-capability-card" key={capability.title}>
            <p className="eyebrow">{capability.eyebrow}</p>
            <h3>{capability.title}</h3>
            <p>{capability.description}</p>
          </article>
        ))}
      </div>

      <section className="automation-boundary-card">
        <p className="eyebrow">Domain boundary</p>
        <h3>Orchestration, not duplicate business state</h3>
        <p>
          Automation will reference Work, Production, Documents & Data, Vendors,
          Customers, and Policy & Compliance through stable contracts. It will
          not recreate their project, document, queue, customer, or policy
          models inside the workflow engine.
        </p>
      </section>
    </section>
  )
}
