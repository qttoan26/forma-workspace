import { fireEvent, render, screen, within } from '@testing-library/react'

import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard', () => {
  it('moves a task between workflow columns', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const task = screen.getByText('Create board interaction model').closest('article')
    expect(task).not.toBeNull()
    fireEvent.change(within(task as HTMLElement).getByRole('combobox'), { target: { value: 'in-progress' } })

    const inProgress = screen.getByRole('heading', { name: 'In Progress' }).closest('section')
    expect(inProgress).not.toBeNull()
    expect(within(inProgress as HTMLElement).getByText('Create board interaction model')).toBeInTheDocument()
  })
})
