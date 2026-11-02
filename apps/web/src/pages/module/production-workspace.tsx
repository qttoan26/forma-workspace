import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useWorkData } from './use-work-data'
import { projectBoardRepository } from '@/pages/project-board/project-board-repository'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import { useDocumentReferences } from '@/entities/document/lib/use-document-references'
import { readProjectDocumentReferences } from '@/entities/document/lib/document-reference-storage'
import { useProductionJobs } from '@/entities/production/lib/use-production-jobs'
import { mutateProductionJob } from '@/entities/production/lib/production-job-storage'
import {
  missingProductionSources,
  productionStatuses,
  productionStatusLabels,
  productionTransitions,
  productionWorkTypes,
  productionWorkTypeLabels,
  type ProductionJob,
  type ProductionSourceContext,
} from '@/entities/production/model/production-job'
import { ProductionJobForm } from '@/features/production-intake/ui/production-job-form'
import { ProductionQueueTable } from '@/widgets/production-queue/production-queue-table'
import { Button } from '@/shared/ui'
import { FactoryIcon, XIcon } from '@/shared/ui/workspace-icons'
import './production-workspace.css'

const appBaseUrl = import.meta.env.BASE_URL

export function ProductionWorkspace({
  sectionId,
}: {
  sectionId?: string | undefined
}) {
  const { data, error, retry } = useWorkData()
  if (error)
    return (
      <section className="module-state-card" role="alert">
        <h2>Production sources could not be loaded</h2>
        <p>Load the current Work project before preparing work packages.</p>
        <Button onClick={retry}>Try again</Button>
      </section>
    )
  if (!data) return <p role="status">Loading production workspace…</p>
  return (
    <ProductionWorkspaceContent
      key={data.project.id}
      data={data}
      sectionId={sectionId}
    />
  )
}

export function ProductionWorkspaceContent({
  data,
  sectionId,
}: {
  data: ProjectBoardData
  sectionId?: string | undefined
}) {
  const { jobs, error, refresh } = useProductionJobs(data.project.id)
  const {
    references,
    error: sourceError,
    refresh: refreshDocuments,
  } = useDocumentReferences(data.project.id)
  const [workflowNote, setWorkflowNote] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [owner, setOwner] = useState('all')
  const [type, setType] = useState('all')
  const [priority, setPriority] = useState('all')
  const [editor, setEditor] = useState<ProductionJob | null>(null)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [removeConfirmation, setRemoveConfirmation] = useState(false)
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const context = useMemo<ProductionSourceContext>(
    () => ({
      projectId: data.project.id,
      tasks: data.initialTasks,
      documents: references,
      members: data.members,
    }),
    [data, references],
  )
  const getSources = useCallback(async (): Promise<ProductionSourceContext> => {
    try {
      const latest = await projectBoardRepository.getProjectBoard({
        workspaceSlug: data.workspace.slug,
        projectId: data.project.id,
      })
      return {
        projectId: latest.project.id,
        tasks: latest.initialTasks,
        members: latest.members,
        documents: readProjectDocumentReferences(latest.project.id),
      }
    } catch {
      throw new Error(
        'Source context could not be loaded. Refresh the project and document sources before saving.',
      )
    }
  }, [data.workspace.slug, data.project.id])
  const editJob = useCallback((job: ProductionJob) => {
    setEditor(job)
    setWorkflowNote('')
    setReviewerId('')
    setMessage('')
    setActionError('')
    setRemoveConfirmation(false)
    setDirty(false)
  }, [])
  function saved(notice: string) {
    setMessage(notice)
    setEditor(null)
    setActionError('')
    refresh()
  }
  function closeEditor() {
    if (!busy) setEditor(null)
  }
  const filtered = useMemo(() => {
    const taskTitles = new Map(
      data.initialTasks.map((task) => [task.id, task.title]),
    )
    const memberNames = new Map(
      data.members.map((member) => [member.id, member.name]),
    )
    const term = query.trim().toLocaleLowerCase()
    return jobs.filter(
      (job) =>
        (sectionId !== 'processing' ||
          ['queued', 'processing'].includes(job.status)) &&
        (sectionId !== 'quality' ||
          ['quality', 'approved'].includes(job.status)) &&
        (status === 'all' || job.status === status) &&
        (owner === 'all' ||
          (owner === 'unassigned' ? !job.ownerId : job.ownerId === owner)) &&
        (type === 'all' || job.workType === type) &&
        (priority === 'all' || job.priority === priority) &&
        `${job.name} ${job.requirements} ${job.taskIds.map((id) => `${id} ${taskTitles.get(id) ?? ''}`).join(' ')} ${memberNames.get(job.ownerId ?? '') ?? ''}`
          .toLocaleLowerCase()
          .includes(term),
    )
  }, [jobs, data, query, status, owner, type, priority, sectionId])
  async function changeJob(
    kind: 'status' | 'remove',
    targetStatus?: ProductionJob['status'],
  ) {
    if (!editor || busy || error || sourceError || (kind === 'status' && dirty))
      return
    setBusy(true)
    setActionError('')
    try {
      const nextStatus = targetStatus ?? 'draft'
      await mutateProductionJob(
        data.project.id,
        kind === 'remove'
          ? { kind: 'remove', expected: editor }
          : {
              kind: 'status',
              expected: editor,
              status: nextStatus,
              note: workflowNote,
              reviewerId,
            },
        getSources,
      )
      saved(
        kind === 'remove'
          ? 'Work package removed locally. Its source tasks and documents are unchanged.'
          : nextStatus === 'queued'
            ? 'Work package queued locally.'
            : nextStatus === 'draft'
              ? 'Work package returned to draft.'
              : `Work package saved locally: ${productionStatusLabels[nextStatus]}.`,
      )
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : 'The change could not be saved. The previous work package is still available. Try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  const unavailable = editor ? missingProductionSources(editor, context) : []
  return (
    <section
      className="production-workspace"
      aria-label="Production intake and queue"
    >
      <div className="production-context">
        <div>
          <FactoryIcon />
          <span>
            {data.project.name}
            <small>Current project · Packages saved on this browser</small>
          </span>
        </div>
        <nav aria-label="Production workspace views">
          <a
            href={`${appBaseUrl}modules/production/intake`}
            aria-current={sectionId === 'intake' ? 'page' : undefined}
          >
            Intake
          </a>
          <a
            href={`${appBaseUrl}modules/production/queue`}
            aria-current={
              !sectionId || sectionId === 'queue' ? 'page' : undefined
            }
          >
            Queue
          </a>
          {['processing', 'quality'].map((id) => (
            <a
              key={id}
              href={`${appBaseUrl}modules/production/${id}`}
              aria-current={sectionId === id ? 'page' : undefined}
            >
              {id === 'processing' ? 'Processing' : 'Quality control'}
            </a>
          ))}
        </nav>
      </div>
      <div
        className="production-metrics"
        aria-label="Production package summary"
      >
        {[
          ['Drafts', jobs.filter((job) => job.status === 'draft').length],
          ['Queued', jobs.filter((job) => job.status === 'queued').length],
          [
            'Processing',
            jobs.filter((job) => job.status === 'processing').length,
          ],
          [
            'Quality review',
            jobs.filter((job) => job.status === 'quality').length,
          ],
          [
            'QC approved',
            jobs.filter((job) => job.status === 'approved').length,
          ],
          ['Unassigned', jobs.filter((job) => !job.ownerId).length],
        ].map(([label, count]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{error ? '—' : count}</strong>
          </article>
        ))}
      </div>
      <p className="production-boundary">
        Track manual processing and quality decisions for existing work
        packages. No automated processing runs here. QC approval records a local
        review; delivery is still in progress.
      </p>
      {message ? (
        <p className="production-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <div className="production-error" role="alert">
          <strong>Saved work packages could not be loaded.</strong>
          <p>Editing is paused to protect saved data.</p>
          <Button onClick={refresh}>Retry packages</Button>
        </div>
      ) : null}
      {sourceError ? (
        <div className="production-error" role="alert">
          <strong>Document sources could not be loaded.</strong>
          <p>Reload the document references before editing packages.</p>
          <Button onClick={refreshDocuments}>Retry sources</Button>
        </div>
      ) : null}
      {sectionId === 'intake' && !error && !sourceError ? (
        <section className="production-intake-panel">
          <div>
            <p className="eyebrow">Job intake</p>
            <h2>Prepare a work package</h2>
            <p>
              Choose source tasks, add requirements and assign an operational
              owner. Save a draft, then review it in the queue.
            </p>
          </div>
          <ProductionJobForm
            projectId={data.project.id}
            tasks={data.initialTasks}
            members={data.members}
            documents={references}
            getSources={getSources}
            onSaved={saved}
          />
        </section>
      ) : null}
      <div className="production-queue-heading">
        <div>
          <p className="eyebrow">
            {sectionId === 'processing'
              ? 'Processing · queued and active'
              : sectionId === 'quality'
                ? 'Quality · review and approved'
                : 'Production queue'}
          </p>
          <h2>Work packages</h2>
        </div>
        <a
          className="production-new-link"
          href={`${appBaseUrl}modules/production/intake`}
        >
          New work package
        </a>
      </div>
      <div className="production-toolbar">
        <label>
          Search packages
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Package, source task, or owner…"
          />
        </label>
        <label>
          Package status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {productionStatuses.map((value) => (
              <option key={value} value={value}>
                {productionStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Owner filter
          <select
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          >
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned</option>
            {data.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Work type filter
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All types</option>
            {productionWorkTypes.map((value) => (
              <option key={value} value={value}>
                {productionWorkTypeLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority filter
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="all">All priorities</option>
            {['low', 'medium', 'high', 'urgent'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={
            !query &&
            status === 'all' &&
            owner === 'all' &&
            type === 'all' &&
            priority === 'all'
          }
          onClick={() => {
            setQuery('')
            setStatus('all')
            setOwner('all')
            setType('all')
            setPriority('all')
          }}
        >
          Clear filters
        </Button>
      </div>
      {!error && !sourceError ? (
        <ProductionQueueTable
          jobs={filtered}
          tasks={data.initialTasks}
          members={data.members}
          context={context}
          projectHref={`${appBaseUrl}workspaces/${encodeURIComponent(data.workspace.slug)}/projects/${encodeURIComponent(data.project.id)}`}
          onEdit={editJob}
        />
      ) : null}
      {editor ? (
        <ProductionEditorModal busy={busy} onClose={closeEditor}>
          <p className="production-editor-meta">
            {productionStatusLabels[editor.status]}
          </p>
          <h3>{editor.name}</h3>
          {error || sourceError ? (
            <p role="alert">
              Package sources are unavailable. Close the editor and reload.
            </p>
          ) : (
            <>
              {unavailable.length ? (
                <p className="production-warning" role="status">
                  Needs attention: {unavailable.join(', ')}. Repair these
                  selections before saving or queuing.
                </p>
              ) : null}
              {['draft', 'queued'].includes(editor.status) ? (
                <ProductionJobForm
                  projectId={data.project.id}
                  tasks={data.initialTasks}
                  members={data.members}
                  documents={references}
                  job={editor}
                  getSources={getSources}
                  onSaved={saved}
                  onBusyChange={setBusy}
                  onEdited={() => setDirty(true)}
                />
              ) : (
                <p>
                  Return the package to the queue before editing its plan.
                  Source tasks and documents remain unchanged.
                </p>
              )}
              <div className="production-workflow-fields">
                <label>
                  Workflow note
                  <textarea
                    value={workflowNote}
                    maxLength={2000}
                    onChange={(event) => setWorkflowNote(event.target.value)}
                    disabled={busy}
                    placeholder="Handoff summary, review findings, corrections or reason to reopen…"
                  />
                </label>
                {editor.status === 'quality' ? (
                  <label>
                    Quality reviewer
                    <select
                      value={reviewerId}
                      onChange={(event) => setReviewerId(event.target.value)}
                      disabled={busy}
                    >
                      <option value="">Select reviewer</option>
                      {data.members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              {(editor.workflowHistory ?? []).length ? (
                <section
                  className="production-workflow-history"
                  aria-label="Local workflow history"
                >
                  <h4>Local workflow history</h4>
                  <p>
                    Manual records on this browser; reviewer names are selected,
                    not authenticated.
                  </p>
                  <ol>
                    {[...(editor.workflowHistory ?? [])]
                      .reverse()
                      .map((entry, index) => (
                        <li key={index}>
                          <strong>
                            {productionStatusLabels[entry.from]} →{' '}
                            {productionStatusLabels[entry.to]}
                          </strong>
                          <time dateTime={entry.at}>
                            {new Date(entry.at).toLocaleString()}
                          </time>
                          {entry.reviewerId ? (
                            <span>
                              Reviewer:{' '}
                              {data.members.find(
                                (member) => member.id === entry.reviewerId,
                              )?.name ?? 'Unavailable reviewer'}
                            </span>
                          ) : null}
                          {entry.note ? <p>{entry.note}</p> : null}
                        </li>
                      ))}
                  </ol>
                </section>
              ) : null}
              {dirty ? (
                <p className="production-warning">
                  Save your changes before changing the queue status.
                </p>
              ) : null}
              <div className="production-editor-actions">
                {productionTransitions[editor.status].map((target) => (
                  <Button
                    key={target}
                    variant="primary"
                    disabled={
                      busy ||
                      dirty ||
                      (target !== 'draft' &&
                        !(target === 'queued' && editor.status !== 'draft') &&
                        unavailable.length > 0)
                    }
                    onClick={() => {
                      void changeJob('status', target)
                    }}
                  >
                    {target === 'queued'
                      ? editor.status === 'draft'
                        ? 'Queue package'
                        : 'Return to queue'
                      : target === 'draft'
                        ? 'Return to draft'
                        : target === 'quality'
                          ? 'Submit for quality review'
                          : target === 'approved'
                            ? 'Approve quality'
                            : editor.status === 'queued'
                              ? 'Start processing'
                              : editor.status === 'quality'
                                ? 'Request rework'
                                : 'Reopen processing'}
                  </Button>
                ))}
                <button
                  className="production-danger"
                  type="button"
                  disabled={busy}
                  onClick={() => setRemoveConfirmation(true)}
                >
                  Remove package
                </button>
              </div>
              {removeConfirmation ? (
                <div
                  className="production-remove-confirmation"
                  role="group"
                  aria-label="Confirm package removal"
                >
                  <p>
                    Remove this work package? Source tasks and documents will
                    remain in their modules.
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() => setRemoveConfirmation(false)}
                  >
                    Keep package
                  </Button>
                  <button
                    className="production-danger"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void changeJob('remove')
                    }}
                  >
                    Confirm remove package
                  </button>
                </div>
              ) : null}
            </>
          )}
          {actionError ? (
            <p className="production-error" role="alert">
              {actionError}
            </p>
          ) : null}
        </ProductionEditorModal>
      ) : null}
    </section>
  )
}

function ProductionEditorModal({
  busy,
  onClose,
  children,
}: {
  busy: boolean
  onClose: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const element = dialog.current
    element?.showModal()
    closeButton.current?.focus()
    return () => {
      element?.close()
      document.body.style.overflow = previous
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])
  return (
    <dialog
      className="production-editor-modal"
      ref={dialog}
      aria-label="Work package editor"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header>
        <h2>Work package details</h2>
        <button
          type="button"
          ref={closeButton}
          disabled={busy}
          aria-label="Close package editor"
          onClick={onClose}
        >
          <XIcon />
        </button>
      </header>
      {children}
    </dialog>
  )
}
