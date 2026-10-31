import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { ProjectFilesView } from './project-files-view'

const mocks = vi.hoisted(() => ({
  loadProjectDocumentReferences: vi.fn(),
}))

vi.mock('@/entities/document/lib/document-reference-storage', () => ({
  documentReferenceChangeEvent: 'forma:document-references-change',
  loadProjectDocumentReferences: mocks.loadProjectDocumentReferences,
}))

const task = {
  id: 'FOR-18',
  projectId: 'project-1',
  title: 'Review approved drawing',
  status: 'todo' as const,
  priority: 'high' as const,
}

const reference = {
  id: 'doc-ref-1',
  projectId: 'project-1',
  taskId: task.id,
  name: 'Approved drawing.pdf',
  location: 'DOC-42',
  createdAt: '2026-10-31T07:00:00.000Z',
}

describe('ProjectFilesView', () => {
  it('shows project references and opens the linked task', () => {
    mocks.loadProjectDocumentReferences.mockReturnValue([reference])
    const onOpenTask = vi.fn()

    render(
      <ProjectFilesView
        projectId="project-1"
        tasks={[task]}
        onOpenTask={onOpenTask}
      />,
    )

    expect(screen.getByText('Approved drawing.pdf')).toBeVisible()
    fireEvent.click(
      screen.getByRole('button', { name: 'Review approved drawing' }),
    )
    expect(onOpenTask).toHaveBeenCalledWith('FOR-18')
  })

  it('refreshes when task linked files change for the same project', () => {
    mocks.loadProjectDocumentReferences
      .mockReturnValueOnce([])
      .mockReturnValueOnce([reference])

    render(
      <ProjectFilesView
        projectId="project-1"
        tasks={[task]}
        onOpenTask={vi.fn()}
      />,
    )

    window.dispatchEvent(
      new CustomEvent('forma:document-references-change', {
        detail: { projectId: 'project-1' },
      }),
    )

    expect(screen.getByText('Approved drawing.pdf')).toBeVisible()
  })
})
