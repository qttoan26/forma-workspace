import { useMemo, useState } from 'react'

import {
  loadProjectDocumentReferences,
  saveProjectDocumentReferences,
} from '@/entities/document/lib/document-reference-storage'
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
  const [references, setReferences] = useState<DocumentReference[]>(() =>
    loadProjectDocumentReferences(projectId),
  )
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const taskReferences = useMemo(
    () => references.filter((reference) => reference.taskId === taskId),
    [references, taskId],
  )

  function commit(nextReferences: DocumentReference[]) {
    setReferences(nextReferences)
    setSaveError(null)

    try {
      saveProjectDocumentReferences(projectId, nextReferences)
    } catch {
      setSaveError(
        'Linked files changed in this session but could not be saved locally.',
      )
    }
  }

  function recordActivity(body: string) {
    const entry = createTaskActivityEntry({
      projectId,
      taskId,
      kind: 'event',
      body,
      authorLabel: 'You',
    })

    void appendTaskActivityToIndexedDb(projectId, taskId, entry).catch(
      () => undefined,
    )
  }

  function addReference() {
    const nextName = name.trim()
    const nextLocation = location.trim()
    if (!nextName || !nextLocation) return

    const reference = createDocumentReference({
      projectId,
      taskId,
      name: nextName,
      location: nextLocation,
    })
    commit([...references, reference])
    setName('')
    setLocation('')
    recordActivity(`Linked file “${nextName}”.`)
  }

  function removeReference(reference: DocumentReference) {
    commit(references.filter((candidate) => candidate.id !== reference.id))
    recordActivity(`Unlinked file “${reference.name}”.`)
  }

  return (
    <section
      className="task-linked-files-panel"
      aria-label="Task linked files"
    >
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

      <div className="task-linked-files-composer">
        <label htmlFor={`task-file-name-${taskId}`}>Document name</label>
        <input
          id={`task-file-name-${taskId}`}
          value={name}
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
          maxLength={4000}
          placeholder="Document ID, path, or https:// link"
          onChange={(event) => setLocation(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            addReference()
          }}
        />
        <div>
          <span>Reference only — no file bytes are copied into Work.</span>
          <Button
            variant="primary"
            type="button"
            disabled={!name.trim() || !location.trim()}
            onClick={addReference}
          >
            Link file
          </Button>
        </div>
      </div>

      {saveError ? <p role="alert">{saveError}</p> : null}

      {taskReferences.length === 0 ? (
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
                {isHttpLocation(reference.location) ? (
                  <a
                    href={reference.location}
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
                onClick={() => removeReference(reference)}
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

function isHttpLocation(location: string) {
  return location.startsWith('https://') || location.startsWith('http://')
}
