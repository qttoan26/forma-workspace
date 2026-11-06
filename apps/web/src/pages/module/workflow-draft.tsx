import { useState, type FormEvent } from 'react'

import { Button, Field } from '@/shared/ui'

import './workflow-draft.css'

const triggers = {
  manual: 'Manual start',
  work: 'Work task status changes',
  documents: 'Document reference added',
  production: 'Production package ready for handoff',
} as const

interface WorkflowDraftPreview {
  name: string
  trigger: string
  condition: string
  action: string
  requiresApproval: boolean
}

export function WorkflowDraft() {
  const [preview, setPreview] = useState<WorkflowDraftPreview | null>(null)
  const [error, setError] = useState('')

  function previewDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const read = (key: string) => {
      const value = values.get(key)
      return typeof value === 'string' ? value.trim() : ''
    }
    const name = read('name')
    const action = read('action')
    const triggerKey = read('trigger')
    if (!name || !action || !Object.hasOwn(triggers, triggerKey)) {
      setError('Enter a workflow name and action, and choose a trigger.')
      return
    }

    setPreview({
      name,
      trigger: triggers[triggerKey as keyof typeof triggers],
      condition: read('condition'),
      action,
      requiresApproval: values.has('approval'),
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
          Outline one workflow and preview its steps. The draft is kept on this
          page while you edit.
        </p>
        <form
          className="workflow-draft-form"
          onSubmit={previewDraft}
          onChange={() => setError('')}
          onReset={() => {
            setPreview(null)
            setError('')
          }}
        >
          <Field label="Workflow name">
            <input name="name" maxLength={120} required />
          </Field>
          <Field label="Trigger">
            <select name="trigger" defaultValue="manual">
              {Object.entries(triggers).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Condition (optional)">
            <textarea name="condition" rows={2} maxLength={500} />
          </Field>
          <Field label="Action">
            <textarea name="action" rows={3} maxLength={1000} required />
          </Field>
          <label className="workflow-draft-approval">
            <input name="approval" type="checkbox" />
            Require manual approval before the action
          </label>
          {error ? <p role="alert">{error}</p> : null}
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
              <span>{preview.trigger}</span>
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
