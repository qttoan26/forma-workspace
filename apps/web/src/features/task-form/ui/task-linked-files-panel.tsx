import { useMemo, useState } from 'react'

import { mutateProjectDocumentReference } from '@/entities/document/lib/document-reference-storage'
import { useDocumentReferences } from '@/entities/document/lib/use-document-references'
import { getDocumentReferenceUrl } from '@/entities/document/lib/document-location'
import {
  createDocumentReference,
  type DocumentReference,
} from '@/entities/document/model/document-reference'
import { appendTaskActivityToIndexedDb } from '@/entities/task/lib/task-indexed-db'
import { createTaskActivityEntry } from '@/entities/task/model/task-activity'
import { Button } from '@/shared/ui'

import './task-linked-files-panel.css'

interface TaskLinkedFilesPanelProps {
  projectId: string
  taskId: string
}

export function TaskLinkedFilesPanel({
  projectId,
  taskId,
}: TaskLinkedFilesPanelProps) {
  const {
    references,
    error: loadError,
    refresh,
  } = useDocumentReferences(projectId)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const taskReferences = useMemo(
    () => references.filter((reference) => reference.taskId === taskId),
    [references, taskId],
  )

  function recordActivity(body: string) {
    const entry = createTaskActivityEntry({
      projectId,
      taskId,
      kind: 'event',
      body,
      authorLabel: 'You',
    })

    void appendTaskActivityToIndexedDb(projectId, taskId, entry).catch(() => {
      setSaveError(
        'Reference saved locally, but its task activity could not be recorded.',
      )
    })
  }

  async function addReference() {
    const nextName = name.trim()
    const nextLocation = location.trim()
    if (!nextName || !nextLocation || busy || loadError) return

    setBusy(true)
    setSaveError(null)
    try {
      const reference = createDocumentReference({
        projectId,
        taskId,
        name: nextName,
        location: nextLocation,
      })
      await mutateProjectDocumentReference(projectId, {
        kind: 'add',
        reference,
      })
      refresh()
      setName('')
      setLocation('')
      recordActivity(`Linked file “${nextName}”.`)
    } catch {
      setSaveError(
        'Could not save this reference. Your inputs are still here. Try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function removeReference(reference: DocumentReference) {
    if (busy || loadError) return
    setBusy(true)
    setSaveError(null)
    try {
      await mutateProjectDocumentReference(projectId, {
        kind: 'remove',
        expected: reference,
      })
      refresh()
      recordActivity(`Unlinked file “${reference.name}”.`)
    } catch {
      setSaveError(
        'Could not unlink this reference. Reload its latest details and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="task-linked-files-panel" aria-label="Task linked files">
      <div className="task-linked-files-heading">
        <div>
          <p className="eyebrow">Documents & Data</p>
          <h3>Linked files</h3>
        </div>
        <span>{taskReferences.length}</span>
      </div>

      <p className="task-linked-files-note">
        Links store document metadata only. File content remains owned by the
        Documents & Data storage layer.
      </p>
      <a href={`${import.meta.env.BASE_URL}modules/documents/library`}>
        Manage document references
      </a>
      {loadError ? (
        <p role="alert">
          References could not be loaded.{' '}
          <button type="button" onClick={refresh}>
            Retry references
          </button>
        </p>
      ) : null}

      <div className="task-linked-files-composer">
        <label htmlFor={`task-file-name-${taskId}`}>Document name</label>
        <input
          id={`task-file-name-${taskId}`}
          value={name}
          disabled={busy || loadError}
          maxLength={500}
          placeholder="e.g. Approved drawing.pdf"
          onChange={(event) => setName(event.target.value)}
        />
        <label htmlFor={`task-file-location-${taskId}`}>
          Reference location
        </label>
        <input
          id={`task-file-location-${taskId}`}
          value={location}
          disabled={busy || loadError}
          maxLength={4000}
          placeholder="Document ID, path, or https:// link"
          onChange={(event) => setLocation(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            void addReference()
          }}
        />
        <div>
          <span>Reference only — no file bytes are copied into Work.</span>
          <Button
            variant="primary"
            type="button"
            disabled={!name.trim() || !location.trim() || busy || loadError}
            onClick={() => {
              void addReference()
            }}
          >
            Link file
          </Button>
        </div>
      </div>

      {saveError ? <p role="alert">{saveError}</p> : null}

      {loadError ? null : taskReferences.length === 0 ? (
        <div className="task-linked-files-empty">
          <strong>No linked files yet</strong>
          <span>Reference documents without duplicating their storage.</span>
        </div>
      ) : (
        <ul className="task-linked-files-list">
          {taskReferences.map((reference) => (
            <li key={reference.id}>
              <div>
                <strong>{reference.name}</strong>
                {getDocumentReferenceUrl(reference.location) ? (
                  <a
                    href={getDocumentReferenceUrl(reference.location)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open reference
                  </a>
                ) : (
                  <span>{reference.location}</span>
                )}
              </div>
              <button
                type="button"
                aria-label={`Unlink ${reference.name}`}
                disabled={busy || loadError}
                onClick={() => {
                  void removeReference(reference)
                }}
              >
                Unlink
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
