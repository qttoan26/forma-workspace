import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { projectBoardRepository } from '@/pages/project-board/project-board-repository'
import { initialTasks, project, workspace } from '@/test/fixtures/project-board'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import { readProductionJobs } from '@/entities/production/lib/production-job-storage'
import {
  readProjectDocumentReferences,
  saveProjectDocumentReferences,
} from '@/entities/document/lib/document-reference-storage'
import { createDocumentReference } from '@/entities/document/model/document-reference'
import { ModulePage } from './module-page'

vi.mock('@/shared/auth/auth-session', () => ({
  isDemoMode: () => false,
  loadAuthSession: () => Promise.resolve({ user: { id: 'operator' } }),
  startLogout: vi.fn(),
}))
vi.mock('@/entities/project/lib/project-catalog', () => ({
  readLocalProjects: () =>
    Promise.resolve([
      {
        id: 'project-linked',
        workspaceId: 'ws-1',
        name: 'Linked operations',
        key: 'LINK',
        description: '',
      },
      {
        id: 'project-other',
        workspaceId: 'ws-1',
        name: 'Other operations',
        key: 'OTHER',
        description: '',
      },
    ]),
  subscribeProjectCatalog: () => () => undefined,
}))

const linked: ProjectBoardData = {
  workspace,
  project: {
    ...project,
    id: 'project-linked',
    key: 'LINK',
    name: 'Linked operations',
  },
  members: [],
  initialTasks: [
    {
      ...initialTasks[0]!,
      id: 'LINK-01',
      projectId: 'project-linked',
      title: 'Prepare linked source',
      assigneeId: undefined,
    },
  ],
}
let latest: ProjectBoardData
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  latest = structuredClone(linked)
  vi.spyOn(projectBoardRepository, 'getProjectBoard').mockImplementation(
    (input) => {
      if (input.accountId !== 'operator')
        return Promise.reject(new Error('Project not found'))
      if (input.projectId === linked.project.id) return Promise.resolve(latest)
      if (input.projectId === 'project-other')
        return Promise.resolve({
          ...linked,
          project: {
            ...linked.project,
            id: 'project-other',
            name: 'Other operations',
          },
          initialTasks: [],
        })
      return Promise.reject(new Error('Project not found'))
    },
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('registers documents for the selected project and clears the form when switching projects', async () => {
  const show = (projectId: string, sectionId = 'intake') => (
    <ModulePage
      moduleId="documents"
      sectionId={sectionId}
      projectId={projectId}
      accountId="operator"
      onProjectChange={vi.fn()}
    />
  )
  const { rerender } = render(show(linked.project.id))
  fireEvent.change(await screen.findByLabelText('Document name'), {
    target: { value: 'Linked brief.pdf' },
  })
  fireEvent.change(screen.getByLabelText('Reference location'), {
    target: { value: 'DOC-LINKED-1' },
  })
  fireEvent.change(screen.getByLabelText('Linked task'), {
    target: { value: 'LINK-01' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Register reference' }))
  await screen.findByText('Reference registered locally.')
  expect(readProjectDocumentReferences(linked.project.id)[0]?.taskId).toBe(
    'LINK-01',
  )
  expect(readProjectDocumentReferences('project-1')).toEqual([])
  const views = screen.getByRole('navigation', {
    name: 'Document workspace views',
  })
  expect(within(views).getByRole('link', { name: 'Library' })).toHaveAttribute(
    'href',
    '/modules/documents/library?project=project-linked',
  )
  fireEvent.change(screen.getByLabelText('Document name'), {
    target: { value: 'Unsaved draft' },
  })
  rerender(show('project-other'))
  expect(await screen.findByLabelText('Document name')).toHaveValue('')
  expect(
    within(screen.getByLabelText('Linked task')).queryByRole('option', {
      name: /LINK-01/,
    }),
  ).not.toBeInTheDocument()
  rerender(show(linked.project.id, 'library'))
  expect(
    await screen.findByRole('button', {
      name: 'Linked brief.pdf',
    }),
  ).toBeInTheDocument()
  const library = screen.getByRole('table', { name: 'Document references' })
  expect(
    within(library).getByRole('link', { name: /LINK-01/ }),
  ).toHaveAttribute(
    'href',
    '/workspaces/forma/projects/project-linked?view=files&task=LINK-01',
  )
})

it('re-resolves Production sources with the current account and rejects removed task links before queueing', async () => {
  const source = createDocumentReference({
    projectId: linked.project.id,
    name: 'Linked brief.pdf',
    location: 'DOC-LINKED-1',
  })
  saveProjectDocumentReferences(linked.project.id, [source])
  render(
    <ModulePage
      moduleId="production"
      sectionId="intake"
      projectId={linked.project.id}
      accountId="operator"
    />,
  )
  fireEvent.change(await screen.findByLabelText('Package name'), {
    target: { value: 'Linked package' },
  })
  fireEvent.click(
    screen.getByRole('checkbox', {
      name: 'LINK-01 Prepare linked source',
    }),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Linked brief.pdf' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save draft package' }))
  await screen.findByText(/^Draft work package saved locally/)
  expect(projectBoardRepository.getProjectBoard).toHaveBeenLastCalledWith({
    workspaceSlug: 'forma',
    projectId: linked.project.id,
    accountId: 'operator',
  })
  expect(readProductionJobs(linked.project.id)[0]).toMatchObject({
    taskIds: ['LINK-01'],
    documentReferenceIds: [source.id],
    status: 'draft',
  })
  expect(readProductionJobs('project-1')).toEqual([])
  const views = screen.getByRole('navigation', {
    name: 'Production workspace views',
  })
  expect(within(views).getByRole('link', { name: 'Queue' })).toHaveAttribute(
    'href',
    '/modules/production/queue?project=project-linked',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Linked package' }))
  latest = { ...latest, initialTasks: [] }
  fireEvent.click(screen.getByRole('button', { name: 'Queue package' }))
  await screen.findByText(
    /Some source tasks, document references or owners are unavailable/,
  )
  expect(readProductionJobs(linked.project.id)[0]?.status).toBe('draft')
})

it.each(['documents', 'production'])(
  'does not retain %s data or draft across an account change',
  async (moduleId) => {
    const onProjectChange = vi.fn()
    const show = (accountId: string) => (
      <ModulePage
        moduleId={moduleId}
        sectionId="intake"
        projectId={linked.project.id}
        accountId={accountId}
        onProjectChange={onProjectChange}
      />
    )
    const { rerender } = render(show('operator'))
    const label = moduleId === 'documents' ? 'Document name' : 'Package name'
    fireEvent.change(await screen.findByLabelText(label), {
      target: { value: 'Private draft' },
    })
    rerender(show('another-account'))
    await screen.findByRole('heading', {
      name:
        moduleId === 'documents'
          ? 'Project context could not be loaded'
          : 'Production sources could not be loaded',
    })
    expect(screen.queryByDisplayValue('Private draft')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Current project' }),
      { target: { value: 'project-1' } },
    )
    expect(onProjectChange).toHaveBeenCalledWith('project-1')
  },
)
