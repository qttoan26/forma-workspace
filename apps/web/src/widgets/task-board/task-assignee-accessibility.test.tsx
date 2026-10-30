import { render, screen } from '@testing-library/react'

import type { Task } from '@/entities/task/model/task'
import { initialTasks, members } from '@/pages/project-board/project-board-data'

import { TaskBoard } from './task-board'

describe('TaskBoard assignee accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('exposes the full assignee name while preserving visible initials', () => {
    render(<TaskBoard initialTasks={initialTasks} members={members} />)

    const assignee = screen.getAllByLabelText('Assignee: Sam Lee')[0]

    expect(assignee).toHaveTextContent('SL')
    expect(assignee).toHaveAttribute('title', 'Sam Lee')
  })

  it('labels tasks without an assignee as unassigned', () => {
    const unassignedTask: Task = {
      id: 'FOR-99',
      projectId: 'project-1',
      title: 'Review unassigned task behavior',
      status: 'todo',
      priority: 'medium',
    }

    render(<TaskBoard initialTasks={[unassignedTask]} members={members} />)

    expect(screen.getByLabelText('Unassigned')).toHaveTextContent('—')
  })
})
