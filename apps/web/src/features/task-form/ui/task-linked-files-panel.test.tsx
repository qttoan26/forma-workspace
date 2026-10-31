import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { TaskLinkedFilesPanel } from './task-linked-files-panel'

const mocks = vi.hoisted(() => ({
  loadProjectDocumentReferences: vi.fn(),
  saveProjectDocumentReferences: vi.fn(),
  appendTaskActivityToIndexedDb: vi.fn(),
}))

vi.mock('@/entities/document/lib/document-reference-storage', () => ({
  loadProjectDocumentReferences: mocks.loadProjectDocumentReferences,
  saveProjectDocumentReferences: mocks.saveProjectDocumentReferences,
}))

vi.mock('@/entities/task/lib/task-indexed-db', () => ({
  appendTaskActivityToIndexedDb: mocks.appendTaskActivityToIndexedDb,
}))

describe('TaskLinkedFilesPanel', () => {
  it('links a document reference to the current task', () => {
    mocks.loadProjectDocumentReferences.mockReturnValue([])
    mocks.saveProjectDocumentReferences.mockImplementation(() => undefined)
    mocks.appendTaskActivityToIndexedDb.mockResolvedValue([])

    render(<TaskLinkedFilesPanel projectId="project-1" taskId="FOR-18" />)

    fireEvent.change(screen.getByLabelText('Document name'), {
      target: { value: 'Approved drawing.pdf' },
    })
    fireEvent.change(screen.getByLabelText('Reference location'), {
      target: { value: 'DOC-42' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Link file' }))

    expect(screen.getByText('Approved drawing.pdf')).toBeVisible()
    expect(screen.getByText('DOC-42')).toBeVisible()
    expect(mocks.saveProjectDocumentReferences).toHaveBeenCalledWith(
      'project-1',
      expect.arrayContaining([
        expect.objectContaining({
          projectId: 'project-1',
          taskId: 'FOR-18',
          name: 'Approved drawing.pdf',
          location: 'DOC-42',
        }),
      ]),
    )
  })
})
