import { useState, type FormEvent } from 'react'
import { z } from 'zod'

import { Button, Field } from '@/shared/ui'
import {
  resolveBrowserStorage,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/shared/lib/browser-storage-health'

import './workflow-draft.css'

const triggerSchema = z.enum(['manual', 'work', 'documents', 'production'])
const triggers: Record<z.infer<typeof triggerSchema>, string> = {
  manual: 'Manual start',
  work: 'Work task status changes',
  documents: 'Document reference added',
  production: 'Production package ready for handoff',
}

const draftSchema = z.object({
  name: z.string().max(120),
  trigger: triggerSchema,
  condition: z.string().max(500),
  action: z.string().max(1000),
  requiresApproval: z.boolean(),
})

type Draft = z.infer<typeof draftSchema>

const emptyDraft: Draft = {
  name: '',
  trigger: 'manual',
  condition: '',
  action: '',
  requiresApproval: false,
}

const storageArea = 'session-storage'

function loadDraft(key: string | undefined) {
  if (!key) return emptyDraft
  try {
    const saved = sessionStorage.getItem(key)
    if (saved === null) return emptyDraft
    const result = draftSchema.safeParse(JSON.parse(saved) as unknown)
    return result.success ? result.data : emptyDraft
  } catch {
    return emptyDraft
  }
}

export function WorkflowDraft({
  accountId,
}: {
  accountId?: string | undefined
}) {
  const draftKey = accountId
    ? `forma:automation-draft:v1:${import.meta.env.BASE_URL}:${accountId}`
    : undefined
  const [draft, setDraft] = useState(() => loadDraft(draftKey))
  const [preview, setPreview] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState('')

  function updateDraft(change: Partial<Draft>) {
    const next = { ...draft, ...change }
    setDraft(next)
    setError('')
    if (!draftKey) return
    const saved = safeStorageSetItem(
      storageArea,
      resolveBrowserStorage(storageArea),
      draftKey,
      JSON.stringify(next),
    )
    setStorageError(
      saved
        ? ''
        : 'This tab could not save the draft. Keep this page open to continue editing.',
    )
  }

  function clearDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      draftKey &&
      !safeStorageRemoveItem(
        storageArea,
        resolveBrowserStorage(storageArea),
        draftKey,
      )
    ) {
      setStorageError(
        'This tab could not clear the saved draft. Try again before reloading.',
      )
      return
    }
    setDraft(emptyDraft)
    setPreview(null)
    setError('')
    setStorageError('')
  }

  function previewDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draft.name.trim()
    const action = draft.action.trim()
    if (!name || !action) {
      setError('Enter a workflow name and action.')
      return
    }

    setPreview({
      ...draft,
      name,
      condition: draft.condition.trim(),
      action,
    })
    setError('')
  }

  return (
    <div className="workflow-draft-layout">
      <section
        className="module-state-card"
        aria-labelledby="draft-editor-title"
      >
        <h2 id="draft-editor-title">Workflow draft</h2>
        <p>
          Outline one workflow and preview its steps. This tab keeps the draft
          for your account.
        </p>
        <form
          className="workflow-draft-form"
          onSubmit={previewDraft}
          onReset={clearDraft}
        >
          <Field label="Workflow name">
            <input
              name="name"
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              maxLength={120}
              required
            />
          </Field>
          <Field label="Trigger">
            <select
              name="trigger"
              value={draft.trigger}
              onChange={(event) => {
                const trigger = triggerSchema.safeParse(event.target.value)
                if (trigger.success) updateDraft({ trigger: trigger.data })
              }}
            >
              {Object.entries(triggers).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Condition (optional)">
            <textarea
              name="condition"
              value={draft.condition}
              onChange={(event) =>
                updateDraft({ condition: event.target.value })
              }
              rows={2}
              maxLength={500}
            />
          </Field>
          <Field label="Action">
            <textarea
              name="action"
              value={draft.action}
              onChange={(event) => updateDraft({ action: event.target.value })}
              rows={3}
              maxLength={1000}
              required
            />
          </Field>
          <label className="workflow-draft-approval">
            <input
              name="approval"
              type="checkbox"
              checked={draft.requiresApproval}
              onChange={(event) =>
                updateDraft({ requiresApproval: event.target.checked })
              }
            />
            Require manual approval before the action
          </label>
          {error ? <p role="alert">{error}</p> : null}
          {storageError ? <p role="alert">{storageError}</p> : null}
          <div className="workflow-draft-actions">
            <Button variant="primary" type="submit">
              Preview draft
            </Button>
            <Button type="reset">Clear draft</Button>
          </div>
        </form>
      </section>
      <section
        className="module-state-card workflow-draft-preview"
        aria-labelledby="draft-preview-title"
      >
        <h2 id="draft-preview-title">Draft preview</h2>
        <p role="status">
          {preview
            ? `Previewing ${preview.name}`
            : 'Complete the draft to see the workflow steps here.'}
        </p>
        {preview ? (
          <ol>
            <li>
              <strong>Trigger</strong>
              <span>{triggers[preview.trigger]}</span>
            </li>
            {preview.condition ? (
              <li>
                <strong>Condition</strong>
                <span>{preview.condition}</span>
              </li>
            ) : null}
            {preview.requiresApproval ? (
              <li>
                <strong>Approval</strong>
                <span>Wait for manual approval.</span>
              </li>
            ) : null}
            <li>
              <strong>Action</strong>
              <span>{preview.action}</span>
            </li>
          </ol>
        ) : null}
      </section>
    </div>
  )
}
