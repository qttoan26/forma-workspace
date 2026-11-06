import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { useMemo } from 'react'
import { useDocumentReferences } from '@/entities/document/lib/use-document-references'
import { getDocumentReferenceUrl } from '@/entities/document/lib/document-location'
import type { Task } from '@/entities/task/model/task'

import './project-files-view.css'

interface ProjectFilesViewProps {
  projectId: string
  tasks: Task[]
  onOpenTask: (taskId: string) => void
}

export function ProjectFilesView({
  projectId,
  tasks,
  onOpenTask,
}: ProjectFilesViewProps) {
  const { references, error, refresh } = useDocumentReferences(projectId)
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  )

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
        <a href={`${import.meta.env.BASE_URL}modules/documents/library`}>
          Manage document references
        </a>
        <span>{error ? 'Unavailable' : `${references.length} references`}</span>
      </header>

      <div className="project-files-boundary-note">
        <strong>Documents & Data owns the document lifecycle.</strong>
        <span>
          Work shows shared references only; file content, versions, OCR, and
          provider storage stay outside the Work module.
        </span>
      </div>

      {error ? (
        <p role="alert">
          Document references could not be loaded.{' '}
          <button type="button" onClick={refresh}>
            Retry references
          </button>
        </p>
      ) : orderedReferences.length === 0 ? (
        <div className="project-files-empty">
          <span aria-hidden="true">F</span>
          <div>
            <strong>No project documents linked yet.</strong>
            <p>
              Link a document from a task Files tab. It will appear here without
              copying file content into Work.
            </p>
          </div>
        </div>
      ) : (
        <ScrollRegion label="Project files list">
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
                    {getDocumentReferenceUrl(reference.location) ? (
                      <a
                        href={getDocumentReferenceUrl(reference.location)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open reference
                      </a>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </ScrollRegion>
      )}
    </section>
  )
}
