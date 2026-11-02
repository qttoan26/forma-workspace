import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { createDocumentReference } from '@/entities/document/model/document-reference'
import {
  mutateProjectDocumentReference,
  readProjectDocumentReferences,
} from '@/entities/document/lib/document-reference-storage'
import { DocumentReferenceForm } from './document-reference-form'

const projectId = 'project-1'
const task = {
  id: 'FOR-18',
  projectId,
  title: 'Source review',
  status: 'todo' as const,
  priority: 'high' as const,
}
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

it('registers a task reference without copying source content', async () => {
  const onSaved = vi.fn()
  render(
    <DocumentReferenceForm
      projectId={projectId}
      tasks={[task]}
      onSaved={onSaved}
    />,
  )
  fireEvent.change(screen.getByLabelText('Document name'), {
    target: { value: 'Source.pdf' },
  })
  fireEvent.change(screen.getByLabelText('Reference location'), {
    target: { value: 'DOC-10' },
  })
  fireEvent.change(screen.getByLabelText('Linked task'), {
    target: { value: task.id },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Register reference' }))
  await waitFor(() =>
    expect(onSaved).toHaveBeenCalledWith('Reference registered locally.'),
  )
  expect(readProjectDocumentReferences(projectId)).toEqual([
    expect.objectContaining({
      taskId: task.id,
      name: 'Source.pdf',
      location: 'DOC-10',
    }),
  ])
})

it('keeps changes when a stale editor conflicts with a saved update', async () => {
  const reference = createDocumentReference({
    projectId,
    name: 'Source.pdf',
    location: 'DOC-10',
  })
  await mutateProjectDocumentReference(projectId, { kind: 'add', reference })
  const onSaved = vi.fn()
  render(
    <DocumentReferenceForm
      projectId={projectId}
      tasks={[task]}
      reference={reference}
      onSaved={onSaved}
    />,
  )
  await mutateProjectDocumentReference(projectId, {
    kind: 'update',
    expected: reference,
    reference: { ...reference, name: 'New source.pdf' },
  })
  fireEvent.change(screen.getByLabelText('Document name'), {
    target: { value: 'Stale source.pdf' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save reference' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'changed in another view',
  )
  expect(screen.getByLabelText('Document name')).toHaveValue('Stale source.pdf')
  expect(readProjectDocumentReferences(projectId)[0]?.name).toBe(
    'New source.pdf',
  )
  expect(onSaved).not.toHaveBeenCalled()
})

it('requires explicit removal confirmation and leaves unrelated references', async () => {
  const reference = createDocumentReference({
    projectId,
    name: 'Source.pdf',
    location: 'DOC-10',
  })
  const other = createDocumentReference({
    projectId,
    name: 'Other.pdf',
    location: 'DOC-11',
  })
  await mutateProjectDocumentReference(projectId, { kind: 'add', reference })
  await mutateProjectDocumentReference(projectId, {
    kind: 'add',
    reference: other,
  })
  const onSaved = vi.fn()
  render(
    <DocumentReferenceForm
      projectId={projectId}
      tasks={[task]}
      reference={reference}
      onSaved={onSaved}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Remove reference' }))
  expect(readProjectDocumentReferences(projectId)).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Confirm remove' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(readProjectDocumentReferences(projectId)).toEqual([other])
})
