import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DocumentReference } from '@/entities/document/model/document-reference'
import { getDocumentReferenceUrl } from '@/entities/document/lib/document-location'
import { useDocumentReferences } from '@/entities/document/lib/use-document-references'
import { DocumentReferenceForm } from '@/features/document-reference/ui/document-reference-form'
import { DocumentLibraryTable } from '@/widgets/document-library/document-library-table'
import { FileStackIcon, XIcon } from '@/shared/ui/workspace-icons'
import { Button } from '@/shared/ui'
import { useWorkData } from './use-work-data'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import './documents-workspace.css'

const appBaseUrl = import.meta.env.BASE_URL
const intakeHref = `${appBaseUrl}modules/documents/intake`

export function DocumentsWorkspace({
  sectionId,
}: {
  sectionId?: string | undefined
}) {
  const { data, error, retry } = useWorkData()
  if (error)
    return (
      <section className="module-state-card" role="alert">
        <h2>Project context could not be loaded</h2>
        <p>Load the current project to register and link documents.</p>
        <Button onClick={retry}>Try again</Button>
      </section>
    )
  if (!data) return <p role="status">Loading document workspace…</p>
  return (
    <DocumentsWorkspaceContent
      key={data.project.id}
      data={data}
      sectionId={sectionId}
    />
  )
}

export function DocumentsWorkspaceContent({
  data,
  sectionId,
}: {
  data: ProjectBoardData
  sectionId?: string | undefined
}) {
  const { references, error, refresh } = useDocumentReferences(data.project.id)
  const isIntake = sectionId === 'intake'
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('all')
  const [source, setSource] = useState('all')
  const [editor, setEditor] = useState<DocumentReference | null>(null)
  const [message, setMessage] = useState('')
  const editReference = useCallback((reference: DocumentReference) => {
    setMessage('')
    setEditor(reference)
  }, [])
  const taskNames = useMemo(
    () => new Map(data.initialTasks.map((task) => [task.id, task.title])),
    [data.initialTasks],
  )
  const counts = { linked: 0, project: 0, unavailable: 0 }
  for (const reference of references) {
    counts[getLinkScope(reference, taskNames)]++
  }
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return references.filter(
      (reference) =>
        (scope === 'all' || scope === getLinkScope(reference, taskNames)) &&
        (source === 'all' ||
          (source === 'web'
            ? Boolean(getDocumentReferenceUrl(reference.location))
            : !getDocumentReferenceUrl(reference.location))) &&
        `${reference.name} ${reference.location} ${reference.taskId ?? ''} ${taskNames.get(reference.taskId ?? '') ?? ''}`
          .toLocaleLowerCase()
          .includes(search),
    )
  }, [references, query, scope, source, taskNames])
  function saved(notice: string) {
    setMessage(notice)
    setEditor(null)
    refresh()
  }
  return (
    <section
      className="documents-workspace"
      aria-label="Document reference workspace"
    >
      <div className="documents-context">
        <div>
          <FileStackIcon />
          <span>
            {data.project.name}
            <small>Current project · References saved on this browser</small>
          </span>
        </div>
        <nav aria-label="Document workspace views">
          <a href={intakeHref} aria-current={isIntake ? 'page' : undefined}>
            Intake
          </a>
          <a
            href={`${appBaseUrl}modules/documents/library`}
            aria-current={
              sectionId === 'library' || !sectionId ? 'page' : undefined
            }
          >
            Library
          </a>
        </nav>
      </div>
      {!isIntake ? (
        <div
          className="document-metrics"
          aria-label="Document reference summary"
        >
          <article>
            <small>All references</small>
            <strong>{error ? '—' : references.length}</strong>
          </article>
          <article>
            <small>Linked to tasks</small>
            <strong>{error ? '—' : counts.linked}</strong>
          </article>
          <article>
            <small>Project-level</small>
            <strong>{error ? '—' : counts.project}</strong>
          </article>
          <article>
            <small>Unavailable task links</small>
            <strong>{error ? '—' : counts.unavailable}</strong>
          </article>
        </div>
      ) : null}
      <p className="documents-boundary-note">
        Register links, IDs and paths here. File upload, versions, OCR and
        approval workflows are still in progress.
      </p>
      {message ? (
        <p className="document-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <div className="document-error" role="alert">
          <strong>References could not be loaded.</strong>
          <p>
            Editing is paused to protect saved data. Check browser storage and
            retry.
          </p>
          <Button onClick={refresh}>Retry references</Button>
        </div>
      ) : null}
      {isIntake ? (
        <section className="document-intake-panel">
          <div>
            <p className="eyebrow">Document intake</p>
            <h2>Register a source document</h2>
            <p>
              Add the source location, then link it to a task when there is work
              to do.
            </p>
          </div>
          {!error ? (
            <DocumentReferenceForm
              projectId={data.project.id}
              tasks={data.initialTasks}
              onSaved={saved}
            />
          ) : null}
        </section>
      ) : (
        <>
          <div className="document-library-heading">
            <div>
              <p className="eyebrow">Document library</p>
              <h2>Your project documents</h2>
            </div>
            <a
              className="button-primary document-register-link"
              href={intakeHref}
            >
              + Register reference
            </a>
          </div>
          <div className="document-toolbar">
            <label>
              Search references
              <input
                type="search"
                value={query}
                placeholder="Document, location, or task…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              Link scope
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value)}
              >
                <option value="all">All references</option>
                <option value="linked">Linked to tasks</option>
                <option value="project">Project-level</option>
                <option value="unavailable">Unavailable task links</option>
              </select>
            </label>
            <label>
              Source type
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                <option value="all">All sources</option>
                <option value="web">Web links</option>
                <option value="id">IDs / paths</option>
              </select>
            </label>
            <Button
              disabled={!query && scope === 'all' && source === 'all'}
              onClick={() => {
                setQuery('')
                setScope('all')
                setSource('all')
              }}
            >
              Clear filters
            </Button>
          </div>
          {!error ? (
            <DocumentLibraryTable
              references={filtered}
              tasks={data.initialTasks}
              projectHref={`${appBaseUrl}workspaces/${encodeURIComponent(data.workspace.slug)}/projects/${encodeURIComponent(data.project.id)}`}
              disabled={error}
              onEdit={editReference}
            />
          ) : null}
          {editor ? (
            <DocumentEditorModal onClose={() => setEditor(null)}>
              {error ? (
                <p role="alert">
                  References are unavailable. Close the editor and retry
                  loading.
                </p>
              ) : (
                <DocumentReferenceForm
                  projectId={data.project.id}
                  tasks={data.initialTasks}
                  reference={editor}
                  onSaved={saved}
                  onCancel={() => setEditor(null)}
                />
              )}
            </DocumentEditorModal>
          ) : null}
        </>
      )}
    </section>
  )
}

function getLinkScope(
  reference: DocumentReference,
  taskNames: ReadonlyMap<string, string>,
) {
  if (!reference.taskId) return 'project'
  return taskNames.has(reference.taskId) ? 'linked' : 'unavailable'
}

function DocumentEditorModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const element = dialog.current
    element?.showModal()
    closeRef.current?.focus()
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="document-editor-modal"
      aria-label="Document reference editor"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <header>
        <h2>Document reference</h2>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close document editor"
          onClick={onClose}
        >
          <XIcon />
        </button>
      </header>
      {children}
    </dialog>
  )
}
