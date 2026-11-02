import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ProductionJobForm } from './production-job-form'
import { readProductionJobs } from '@/entities/production/lib/production-job-storage'

const task = {
  id: 'FOR-18',
  projectId: 'project-1',
  title: 'Review source material',
  status: 'todo' as const,
  priority: 'high' as const,
}
const member = {
  id: 'member-2',
  name: 'Tony Stark',
  initials: 'TS',
  role: 'Engineering',
}
const sources = () =>
  Promise.resolve({
    projectId: 'project-1',
    tasks: [task],
    documents: [],
    members: [member],
  })
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())
function fillForm() {
  fireEvent.change(screen.getByLabelText('Package name'), {
    target: { value: 'Source preparation' },
  })
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'FOR-18 Review source material' }),
  )
}
it('saves a draft referencing an existing task and clears the form only after success', async () => {
  const onSaved = vi.fn()
  render(
    <ProductionJobForm
      projectId="project-1"
      tasks={[task]}
      documents={[]}
      members={[member]}
      getSources={sources}
      onSaved={onSaved}
    />,
  )
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: 'Save draft package' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
  expect(readProductionJobs('project-1')).toEqual([
    expect.objectContaining({
      taskIds: ['FOR-18'],
      status: 'draft',
      name: 'Source preparation',
    }),
  ])
  expect(screen.getByLabelText('Package name')).toHaveValue('')
})
it('retains the draft and selected sources when saving fails', async () => {
  const onSaved = vi.fn()
  render(
    <ProductionJobForm
      projectId="project-1"
      tasks={[task]}
      documents={[]}
      members={[member]}
      getSources={sources}
      onSaved={onSaved}
    />,
  )
  fillForm()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save draft package' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save')
  expect(screen.getByLabelText('Package name')).toHaveValue(
    'Source preparation',
  )
  expect(
    screen.getByRole('checkbox', { name: 'FOR-18 Review source material' }),
  ).toBeChecked()
  expect(onSaved).not.toHaveBeenCalled()
})
