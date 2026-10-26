import type { Task } from '@/entities/task/model/task'

import { loadProjectTasks, saveProjectTasks } from './task-storage'

const fallback: Task[] = [
  {
    id: 'FOR-01',
    projectId: 'project-1',
    title: 'Seed task',
    status: 'todo',
    priority: 'medium',
  },
]

describe('task storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('round-trips valid project tasks', () => {
    const tasks: Task[] = [
      {
        ...fallback[0],
        title: 'Persisted task',
      },
    ]

    saveProjectTasks('project-1', tasks)

    expect(loadProjectTasks('project-1', fallback)).toEqual(tasks)
  })

  it('falls back when persisted tasks belong to another project', () => {
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([{ ...fallback[0], projectId: 'project-2' }]),
    )

    expect(loadProjectTasks('project-1', fallback)).toEqual(fallback)
  })
})
