import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { saveProjectDocumentReferences } from '@/entities/document/lib/document-reference-storage'
import { ProjectFilesView } from './project-files-view'

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
beforeEach(() => localStorage.clear())

describe('ProjectFilesView', () => {
  it('shows shared references and opens their linked task', () => {
    saveProjectDocumentReferences('project-1', [reference])
    const onOpenTask = vi.fn()
    render(
      <ProjectFilesView
        projectId="project-1"
        tasks={[task]}
        onOpenTask={onOpenTask}
      />,
    )
    expect(screen.getByText('Approved drawing.pdf')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: task.title }))
    expect(onOpenTask).toHaveBeenCalledWith(task.id)
  })
  it('refreshes when a reference changes in another view', () => {
    render(
      <ProjectFilesView
        projectId="project-1"
        tasks={[task]}
        onOpenTask={vi.fn()}
      />,
    )
    act(() => saveProjectDocumentReferences('project-1', [reference]))
    expect(screen.getByText('Approved drawing.pdf')).toBeVisible()
    act(() => {
      localStorage.setItem(
        'forma-workspace:project-document-references:v1:project-1',
        '[]',
      )
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'forma-workspace:project-document-references:v1:project-1',
        }),
      )
    })
    expect(screen.queryByText('Approved drawing.pdf')).not.toBeInTheDocument()
  })
})
