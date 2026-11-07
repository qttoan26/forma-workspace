import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  createLocalProject,
  type ProjectCatalogScope,
} from '@/entities/project/lib/project-catalog'
import {
  projectCreateSchema,
  type ProjectCreateValues,
} from '@/entities/project/model/project-create'
import { Button, Field } from '@/shared/ui'
import { Modal } from '@/shared/ui/modal/modal'

export function ProjectCreateForm({
  scope,
  reservedKeys,
  onDismiss,
  onSaved,
}: {
  scope: ProjectCatalogScope
  reservedKeys: string[]
  onDismiss: () => void
  onSaved: () => void
}) {
  const [failure, setFailure] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreateValues>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: { name: '', key: '', description: '' },
  })
  async function save(values: ProjectCreateValues) {
    setFailure('')
    try {
      await createLocalProject(scope, values, reservedKeys)
      onSaved()
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : 'Project could not be saved. Try again.',
      )
    }
  }
  return (
    <Modal
      className="project-create-modal"
      aria-labelledby="create-project-title"
      onDismiss={() => {
        if (!isSubmitting) onDismiss()
      }}
    >
      <form
        className="project-create-form"
        onSubmit={(event) => {
          void handleSubmit(save)(event)
        }}
      >
        <header>
          <div>
            <p className="eyebrow">Work / Projects</p>
            <h2 id="create-project-title">Create project</h2>
          </div>
          <Button type="button" disabled={isSubmitting} onClick={onDismiss}>
            Cancel
          </Button>
        </header>
        <p>
          Start with an empty board. Projects are saved for your account on this
          browser.
        </p>
        <Field label="Project name" error={errors.name?.message}>
          <input
            data-modal-autofocus
            maxLength={120}
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>
        <Field label="Project key" error={errors.key?.message}>
          <input
            maxLength={10}
            placeholder="e.g. WEB"
            aria-invalid={Boolean(errors.key)}
            {...register('key')}
          />
        </Field>
        <small>
          2–10 letters or numbers, starting with a letter. Used for task IDs.
        </small>
        <Field label="Description" error={errors.description?.message}>
          <textarea rows={4} maxLength={2000} {...register('description')} />
        </Field>
        {failure ? <p role="alert">{failure}</p> : null}
        <footer>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving project…' : 'Create project'}
          </Button>
        </footer>
      </form>
    </Modal>
  )
}
