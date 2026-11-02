import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { readProjectDocumentReferences } from '@/entities/document/lib/document-reference-storage'
import { TaskLinkedFilesPanel } from './task-linked-files-panel'

const appendActivity = vi.hoisted(() => vi.fn())
vi.mock('@/entities/task/lib/task-indexed-db', () => ({
  appendTaskActivityToIndexedDb: appendActivity,
}))

beforeEach(() => {
  localStorage.clear()
  appendActivity.mockReset().mockResolvedValue([])
})
afterEach(() => vi.restoreAllMocks())

function fillReference() {
  fireEvent.change(screen.getByLabelText('Document name'), {
    target: { value: 'Approved drawing.pdf' },
  })
  fireEvent.change(screen.getByLabelText('Reference location'), {
    target: { value: 'DOC-42' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Link file' }))
}

describe('TaskLinkedFilesPanel', () => {
  it('persists a shared reference before recording task activity', async () => {
    render(<TaskLinkedFilesPanel projectId="project-1" taskId="FOR-18" />)
    fillReference()
    await waitFor(() => expect(appendActivity).toHaveBeenCalledOnce())
    expect(readProjectDocumentReferences('project-1')).toEqual([
      expect.objectContaining({
        projectId: 'project-1',
        taskId: 'FOR-18',
        name: 'Approved drawing.pdf',
        location: 'DOC-42',
      }),
    ])
    expect(screen.getByText('DOC-42')).toBeVisible()
    expect(screen.getByLabelText('Document name')).toHaveValue('')
  })

  it('retains inputs and writes no activity when saving fails', async () => {
    render(<TaskLinkedFilesPanel projectId="project-1" taskId="FOR-18" />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    fillReference()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save this reference',
    )
    expect(screen.getByLabelText('Document name')).toHaveValue(
      'Approved drawing.pdf',
    )
    expect(appendActivity).not.toHaveBeenCalled()
    expect(readProjectDocumentReferences('project-1')).toEqual([])
  })
})
