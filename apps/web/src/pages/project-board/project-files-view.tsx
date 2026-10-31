import { useEffect, useMemo, useState } from 'react'

import {
  documentReferenceChangeEvent,
  loadProjectDocumentReferences,
} from '@/entities/document/lib/document-reference-storage'
import type { DocumentReference } from '@/entities/document/model/document-reference'
import type { Task } from '@/entities/task/model/task'

import './project-files-view.css'

interface ProjectFilesViewProps {
  projectId: string
  tasks: Task[]
  onOpenTask: (taskId: string) => void
}

interface DocumentReferenceChangeDetail {
  projectId?: string
}

export function ProjectFilesView({
  projectId,
  tasks,
  onOpenTask,
}: ProjectFilesViewProps) {
  const [references, setReferences] = useState<DocumentReference[]>(() =>
    loadProjectDocumentReferences(projectId),
  )
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  )

  useEffect(() => {
    function handleReferenceChange(event: Event) {
      if (!(event instanceof CustomEvent)) return
      const detail = (event as CustomEvent<DocumentReferenceChangeDetail>)
        .detail
      if (detail.projectId !== projectId) return
      setReferences(loadProjectDocumentReferences(projectId))
    }

    window.addEventListener(documentReferenceChangeEvent, handleReferenceChange)
    return () =>
      window.removeEventListener(
        documentReferenceChangeEvent,
        handleReferenceChange,
      )
  }, [projectId])

  const orderedReferences = useMemo(
    () =>
      [...references].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    [references],
  )

  return (
    <section
      className="project-view-surface project-files-surface"
      aria-label="Project documents"
    >
      <header className="project-view-heading">
        <div>
          <small>Files</small>
          <h2>Project documents</h2>
        </div>
        <span>{references.length} references</span>
      </header>

      <div className="project-files-boundary-note">
        <strong>Documents & Data owns the document lifecycle.</strong>
        <span>
          Work shows shared references only; file content, versions, OCR, and
          provider storage stay outside the Work module.
        </span>
      </div>

      {orderedReferences.length === 0 ? (
        <div className="project-files-empty">
          <span aria-hidden="true">F</span>
          <div>
            <strong>No project documents linked yet.</strong>
            <p>
              Link a document from a task Files tab. It will appear here
              without copying file content into Work.
            </p>
          </div>
        </div>
      ) : (
        <ul className="project-files-list">
          {orderedReferences.map((reference) => {
            const linkedTask = reference.taskId
              ? taskById.get(reference.taskId)
              : undefined

            return (
              <li key={reference.id}>
                <div className="project-file-main">
                  <span className="project-file-mark" aria-hidden="true">
                    F
                  </span>
                  <div>
                    <strong>{reference.name}</strong>
                    <small>{reference.location}</small>
                  </div>
                </div>
                <div className="project-file-context">
                  {linkedTask ? (
                    <button
                      type="button"
                      onClick={() => onOpenTask(linkedTask.id)}
                    >
                      {linkedTask.title}
                    </button>
                  ) : reference.taskId ? (
                    <span>Task {reference.taskId}</span>
                  ) : (
                    <span>Project-level reference</span>
                  )}
                  {isHttpLocation(reference.location) ? (
                    <a href={reference.location} target="_blank" rel="noreferrer">
                      Open reference
                    </a>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function isHttpLocation(location: string) {
  return location.startsWith('https://') || location.startsWith('http://')
}
