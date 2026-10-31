import {
  CheckSquareIcon,
  ClipboardIcon,
  FileStackIcon,
  ShieldIcon,
  SparkIcon,
} from '@/shared/ui/workspace-icons'

import './documents-data-surface.css'

const documentStages = [
  {
    id: 'intake',
    label: 'Intake',
    description: 'Receive document batches and register source context.',
    icon: FileStackIcon,
  },
  {
    id: 'ocr',
    label: 'Scan & OCR',
    description: 'Extract text and machine-readable document content.',
    icon: SparkIcon,
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Validate extracted fields, exceptions, and document quality.',
    icon: CheckSquareIcon,
  },
  {
    id: 'structured-data',
    label: 'Structured Data',
    description: 'Normalize reviewed information into traceable records.',
    icon: ClipboardIcon,
  },
  {
    id: 'handoff',
    label: 'Handoff',
    description: 'Publish approved outputs to Work and downstream systems.',
    icon: ShieldIcon,
  },
] as const

export function DocumentsDataSurface() {
  return (
    <section
      className="documents-data-surface"
      aria-label="Documents and Data module foundation"
    >
      <header className="documents-data-intro">
        <div>
          <p className="eyebrow">Document lifecycle</p>
          <h2>Digitization pipeline</h2>
          <p>
            This module owns document intake, processing, review, structured
            data, and handoff. Work consumes document references only and does
            not own file bytes or document lifecycle state.
          </p>
        </div>
        <span className="documents-data-foundation-badge">
          Frontend foundation
        </span>
      </header>

      <div className="documents-data-stage-grid">
        {documentStages.map((stage, index) => {
          const StageIcon = stage.icon

          return (
            <article className="documents-data-stage-card" key={stage.id}>
              <div className="documents-data-stage-heading">
                <span className="documents-data-stage-icon" aria-hidden="true">
                  <StageIcon />
                </span>
                <span className="documents-data-stage-index">
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

      <div className="documents-data-boundary-grid">
        <article className="documents-data-boundary-card is-live">
          <p className="eyebrow">Available now</p>
          <h3>Shared document references</h3>
          <p>
            Task Files and Project Files already share the same project-scoped
            document reference model. Linking or unlinking a reference updates
            the Work surfaces without copying document content.
          </p>
        </article>

        <article className="documents-data-boundary-card">
          <p className="eyebrow">Next integration</p>
          <h3>Repository / provider boundary</h3>
          <p>
            Uploads, versions, OCR output, retention, permissions, and provider
            storage are intentionally not simulated. They will connect behind
            this module boundary when the document repository is implemented.
          </p>
        </article>
      </div>
    </section>
  )
}
