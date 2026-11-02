import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { saveProjectTasks } from '@/entities/task/lib/task-storage'
import { ModulePage } from './module-page'

vi.mock('@/shared/auth/auth-session', () => ({
  isDemoMode: () => true,
  loadAuthSession: vi.fn(),
  startLogout: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('forma-workspace:sidebar-expanded:v1', 'true')
})
afterEach(cleanup)

describe('Workspace section navigation', () => {
  it('keeps the active Work group and its current detail together in one sidebar', async () => {
    render(<ModulePage moduleId="work" sectionId="projects" />)
    const navigation = screen.getByRole('navigation', { name: 'Work sections' })
    expect(
      within(navigation).getByRole('link', { name: 'Projects' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getAllByRole('navigation', { name: 'Work sections' }),
    ).toHaveLength(1)
    expect(
      await screen.findByRole('heading', { name: 'Avengers Initiative' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open project' })).toHaveAttribute(
      'href',
      '/workspaces/forma/projects/project-1',
    )
  })

  it('renders the selected module detail instead of the overview or another section', () => {
    render(<ModulePage moduleId="documents" sectionId="ocr" />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'OCR & extraction' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Extraction jobs')).toBeInTheDocument()
    expect(screen.queryByText('Intake batches')).not.toBeInTheDocument()
    expect(
      within(
        screen.getByRole('navigation', { name: 'Documents & Data sections' }),
      ).getByRole('link', { name: /OCR & extraction/ }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    ['work', 'missing'],
    ['documents', 'missing'],
    ['unknown', undefined],
  ])('rejects unknown route %s/%s', (moduleId, sectionId) => {
    render(<ModulePage moduleId={moduleId} sectionId={sectionId} />)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: sectionId ? 'Section not found' : 'Module not found',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('This area is being completed.'),
    ).not.toBeInTheDocument()
  })

  it('uses saved project tasks and correct assignees in My Tasks', async () => {
    saveProjectTasks('project-1', [
      {
        id: 'FOR-18',
        projectId: 'project-1',
        title: 'Saved task from project board',
        status: 'todo',
        priority: 'high',
        assigneeId: 'member-2',
      },
      {
        id: 'FOR-99',
        projectId: 'project-1',
        title: 'Another member task',
        status: 'todo',
        priority: 'low',
        assigneeId: 'member-1',
      },
    ])
    render(<ModulePage moduleId="work" sectionId="my-tasks" />)
    expect(
      // The shared table is a lazy chunk loaded after the repository snapshot.
      await screen.findByRole(
        'link',
        {
          name: 'Saved task from project board',
        },
        { timeout: 3000 },
      ),
    ).toHaveAttribute(
      'href',
      '/workspaces/forma/projects/project-1?task=FOR-18',
    )
    expect(screen.queryByText('Another member task')).not.toBeInTheDocument()
    expect(screen.queryByText('FOR-101')).not.toBeInTheDocument()
  })

  it('opens the Inbox surface without fabricating historical events or sidebar counts', async () => {
    render(<ModulePage moduleId="work" sectionId="inbox" />)
    expect(
      await screen.findByRole('region', { name: 'Project inbox' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Assignments/ })).toBeInTheDocument()
    expect(screen.getAllByText(/Current assignment/).length).toBeGreaterThan(0)
    expect(
      screen.queryByRole('region', { name: 'Inbox implementation status' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/You were assigned FOR/)).not.toBeInTheDocument()
    expect(document.querySelector('.workspace-sidebar-counter')).toBeNull()
  })

  it('opens module details from the collapsed icon rail and persists expansion', () => {
    localStorage.removeItem('forma-workspace:sidebar-expanded:v1')
    render(<ModulePage moduleId="production" sectionId="quality" />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open Production menu' }),
    )
    const navigation = screen.getByRole('navigation', {
      name: 'Production sections',
    })
    expect(
      within(navigation).getByRole('link', { name: /Quality control/ }),
    ).toHaveAttribute('aria-current', 'page')
    expect(localStorage.getItem('forma-workspace:sidebar-expanded:v1')).toBe(
      'true',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse Production sections' }),
    )
    expect(
      screen.queryByRole('navigation', { name: 'Production sections' }),
    ).not.toBeInTheDocument()
  })
})
