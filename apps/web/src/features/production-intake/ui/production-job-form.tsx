import { useId, useState, type FormEvent } from 'react'
import type { Task } from '@/entities/task/model/task'
import { taskPriorities } from '@/entities/task/model/task'
import type { Member } from '@/entities/member/model/member'
import type { DocumentReference } from '@/entities/document/model/document-reference'
import {
  productionJobInputSchema,
  productionWorkTypes,
  productionWorkTypeLabels,
  type ProductionJob,
  type ProductionSourceContext,
} from '@/entities/production/model/production-job'
import { mutateProductionJob } from '@/entities/production/lib/production-job-storage'
import { Button } from '@/shared/ui'

export function ProductionJobForm({
  projectId,
  tasks,
  members,
  documents,
  job,
  getSources,
  onSaved,
  onBusyChange,
  onEdited,
}: {
  projectId: string
  tasks: Task[]
  members: Member[]
  documents: DocumentReference[]
  job?: ProductionJob | undefined
  getSources: () => Promise<ProductionSourceContext>
  onSaved: (message: string) => void
  onBusyChange?: ((busy: boolean) => void) | undefined
  onEdited?: (() => void) | undefined
}) {
  const id = useId()
  const [name, setName] = useState(job?.name ?? '')
  const [workType, setWorkType] = useState(job?.workType ?? 'general')
  const [requirements, setRequirements] = useState(job?.requirements ?? '')
  const [ownerId, setOwnerId] = useState(job?.ownerId ?? '')
  const [priority, setPriority] = useState(job?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(job?.dueDate ?? '')
  const [taskIds, setTaskIds] = useState(job?.taskIds ?? [])
  const [documentIds, setDocumentIds] = useState(
    job?.documentReferenceIds ?? [],
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const unavailableTasks = taskIds.filter(
    (selected) => !tasks.some((task) => task.id === selected),
  )
  const unavailableDocuments = documentIds.filter(
    (selected) => !documents.some((reference) => reference.id === selected),
  )
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const result = productionJobInputSchema.safeParse({
      name,
      workType,
      requirements,
      priority,
      ...(ownerId ? { ownerId } : {}),
      ...(dueDate ? { dueDate } : {}),
      taskIds,
      documentReferenceIds: documentIds,
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check the package details.')
      return
    }
    setBusy(true)
    onBusyChange?.(true)
    setError('')
    try {
      await mutateProductionJob(
        projectId,
        job
          ? { kind: 'update', expected: job, input: result.data }
          : { kind: 'create', input: result.data },
        getSources,
      )
      if (!job) {
        setName('')
        setRequirements('')
        setTaskIds([])
        setDocumentIds([])
        setOwnerId('')
        setDueDate('')
        setPriority('medium')
        setWorkType('general')
      }
      onSaved(
        job
          ? 'Work package updated locally.'
          : 'Draft work package saved locally. Open it in the queue when you are ready to queue it.',
      )
    } catch (cause) {
      setError(
        cause instanceof Error &&
          (cause.message.includes('another view') ||
            cause.message.includes('source') ||
            cause.message.includes('Source'))
          ? cause.message
          : 'Could not save the work package. Your changes are still here. Check browser storage and try again.',
      )
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }
  function toggle(current: string[], value: string, checked: boolean) {
    return checked
      ? [...current, value]
      : current.filter((candidate) => candidate !== value)
  }
  return (
    <form
      className="production-job-form"
      onChangeCapture={() => onEdited?.()}
      aria-label={job ? 'Edit work package' : 'Create work package'}
      onSubmit={(event) => {
        void submit(event)
      }}
    >
      <fieldset disabled={busy}>
        <label htmlFor={`${id}-name`}>Package name</label>
        <input
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={3}
          maxLength={160}
          placeholder="e.g. Source document preparation"
        />
        <div className="production-form-grid">
          <label>
            Work type
            <select
              value={workType}
              onChange={(event) =>
                setWorkType(event.target.value as ProductionJob['workType'])
              }
            >
              {productionWorkTypes.map((type) => (
                <option key={type} value={type}>
                  {productionWorkTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <select
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {ownerId && !members.some((member) => member.id === ownerId) ? (
                <option value={ownerId}>Unavailable owner · {ownerId}</option>
              ) : null}
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as ProductionJob['priority'])
              }
            >
              {taskPriorities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
        </div>
        <label htmlFor={`${id}-requirements`}>Processing requirements</label>
        <textarea
          id={`${id}-requirements`}
          value={requirements}
          onChange={(event) => setRequirements(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Describe the output, checks and handoff requirements…"
        />
        <fieldset className="production-source-fieldset">
          <legend>Work tasks · {taskIds.length} selected</legend>
          <small>Choose at least one task from this project.</small>
          <div
            className="production-source-list"
            role="group"
            aria-label="Package task sources"
          >
            {tasks.map((task) => (
              <label key={task.id}>
                <input
                  type="checkbox"
                  checked={taskIds.includes(task.id)}
                  onChange={(event) =>
                    setTaskIds(toggle(taskIds, task.id, event.target.checked))
                  }
                />
                <span>
                  <strong>{task.id}</strong> {task.title}
                </span>
              </label>
            ))}
            {unavailableTasks.map((selected) => (
              <label key={selected}>
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    setTaskIds(
                      taskIds.filter((candidate) => candidate !== selected),
                    )
                  }
                />
                <span className="production-warning">
                  Task {selected} · unavailable; deselect to repair
                </span>
              </label>
            ))}
            {!tasks.length ? (
              <p>
                No Work tasks available.{' '}
                <a href={`${import.meta.env.BASE_URL}modules/work/tasks`}>
                  Open Work
                </a>{' '}
                to add a task first.
              </p>
            ) : null}
          </div>
        </fieldset>
        <fieldset className="production-source-fieldset">
          <legend>Document references · {documentIds.length} selected</legend>
          <small>Optional. Keep the source in Documents & Data.</small>
          <div
            className="production-source-list"
            role="group"
            aria-label="Package document sources"
          >
            {documents.map((reference) => (
              <label key={reference.id}>
                <input
                  type="checkbox"
                  checked={documentIds.includes(reference.id)}
                  onChange={(event) =>
                    setDocumentIds(
                      toggle(documentIds, reference.id, event.target.checked),
                    )
                  }
                />
                <span>{reference.name}</span>
              </label>
            ))}
            {unavailableDocuments.map((selected) => (
              <label key={selected}>
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    setDocumentIds(
                      documentIds.filter((candidate) => candidate !== selected),
                    )
                  }
                />
                <span className="production-warning">
                  Document {selected} · unavailable; deselect to repair
                </span>
              </label>
            ))}
            {!documents.length ? (
              <p>
                No document references yet.{' '}
                <a href={`${import.meta.env.BASE_URL}modules/documents/intake`}>
                  Register a source document
                </a>
                .
              </p>
            ) : null}
          </div>
        </fieldset>
      </fieldset>
      {error ? (
        <p className="production-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="production-form-actions">
        <small>
          {job
            ? 'Updates apply to this work package only.'
            : 'New packages start as drafts.'}
        </small>
        <Button
          variant="primary"
          type="submit"
          disabled={busy || !name.trim() || !taskIds.length}
        >
          {busy ? 'Saving…' : job ? 'Save package' : 'Save draft package'}
        </Button>
      </div>
    </form>
  )
}
