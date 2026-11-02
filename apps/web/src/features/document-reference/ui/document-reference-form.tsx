import { useId, useState, type FormEvent } from 'react'
import {
  DocumentReferenceConflict,
  mutateProjectDocumentReference,
} from '@/entities/document/lib/document-reference-storage'
import {
  createDocumentReference,
  type DocumentReference,
} from '@/entities/document/model/document-reference'
import type { Task } from '@/entities/task/model/task'
import { Button } from '@/shared/ui'

export function DocumentReferenceForm({
  projectId,
  tasks,
  reference,
  onSaved,
  onCancel,
}: {
  projectId: string
  tasks: Task[]
  reference?: DocumentReference | undefined
  onSaved: (message: string) => void
  onCancel?: (() => void) | undefined
}) {
  const id = useId()
  const [name, setName] = useState(reference?.name ?? '')
  const [location, setLocation] = useState(reference?.location ?? '')
  const [taskId, setTaskId] = useState(reference?.taskId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const unavailableTask = Boolean(
    taskId && !tasks.some((task) => task.id === taskId),
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !name.trim() || !location.trim()) return
    setError(null)
    setBusy(true)
    try {
      const next = reference
        ? {
            ...reference,
            name: name.trim(),
            location: location.trim(),
            taskId: taskId || undefined,
          }
        : createDocumentReference({
            projectId,
            name,
            location,
            ...(taskId ? { taskId } : {}),
          })
      await mutateProjectDocumentReference(
        projectId,
        reference
          ? { kind: 'update', expected: reference, reference: next }
          : { kind: 'add', reference: next },
      )
      if (!reference) {
        setName('')
        setLocation('')
        setTaskId('')
      }
      onSaved(
        reference
          ? 'Reference updated locally.'
          : 'Reference registered locally.',
      )
    } catch (cause) {
      setError(
        cause instanceof DocumentReferenceConflict
          ? cause.message
          : 'Could not save this reference. Your changes are still here. Check browser storage and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!reference || busy) return
    setBusy(true)
    setError(null)
    try {
      await mutateProjectDocumentReference(projectId, {
        kind: 'remove',
        expected: reference,
      })
      onSaved('Reference removed locally. The source document was not deleted.')
    } catch (cause) {
      setError(
        cause instanceof DocumentReferenceConflict
          ? cause.message
          : 'Could not remove this reference. It remains saved. Try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="document-reference-form"
      onSubmit={(event) => {
        void submit(event)
      }}
      aria-label={
        reference ? 'Edit document reference' : 'Register document reference'
      }
    >
      <fieldset disabled={busy}>
        <label htmlFor={`${id}-name`}>Document name</label>
        <input
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={500}
          required
          placeholder="e.g. Approved source brief.pdf"
        />
        <label htmlFor={`${id}-location`}>Reference location</label>
        <input
          id={`${id}-location`}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          maxLength={4000}
          required
          placeholder="https:// link, document ID, or path"
          aria-describedby={`${id}-location-hint`}
        />
        <small id={`${id}-location-hint`}>
          Keep the source in its current location. Only HTTP(S) links can be
          opened here.
        </small>
        <label htmlFor={`${id}-task`}>Linked task</label>
        <select
          id={`${id}-task`}
          value={taskId}
          onChange={(event) => setTaskId(event.target.value)}
        >
          <option value="">Project-level reference</option>
          {unavailableTask ? (
            <option value={taskId}>Unavailable task · {taskId}</option>
          ) : null}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.id} · {task.title}
            </option>
          ))}
        </select>
        <small>
          {unavailableTask
            ? 'This task is no longer available. Keep the reference or choose another task.'
            : 'Optional. Linked references also appear in the task Files tab.'}
        </small>
      </fieldset>
      {error ? (
        <p className="document-error" role="alert">
          {error}
        </p>
      ) : null}
      {confirmRemove ? (
        <div
          className="document-remove-confirmation"
          role="group"
          aria-label="Confirm reference removal"
        >
          <p>
            Remove “{reference?.name}” from this project and its task? The
            source document will stay in its current location.
          </p>
          <Button
            type="button"
            disabled={busy}
            onClick={() => setConfirmRemove(false)}
          >
            Keep reference
          </Button>
          <button
            className="document-danger"
            type="button"
            disabled={busy}
            onClick={() => {
              void remove()
            }}
          >
            Confirm remove
          </button>
        </div>
      ) : null}
      <div className="document-form-actions">
        {reference ? (
          <button
            className="document-danger"
            type="button"
            disabled={busy}
            onClick={() => setConfirmRemove(true)}
          >
            Remove reference
          </button>
        ) : null}
        {onCancel ? (
          <Button type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          variant="primary"
          type="submit"
          disabled={busy || !name.trim() || !location.trim()}
        >
          {busy
            ? 'Saving…'
            : reference
              ? 'Save reference'
              : 'Register reference'}
        </Button>
      </div>
    </form>
  )
}
