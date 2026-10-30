import type { Task } from './task'
import {
  appendTask,
  moveTaskToStatus,
  removeTask,
  restoreTask,
  updateTaskValues,
} from './task-mutations'

const tasks: Task[] = [
  {
    id: 'FOR-1',
    projectId: 'project-1',
    title: 'First task',
    status: 'todo',
    priority: 'medium',
  },
  {
    id: 'FOR-2',
    projectId: 'project-1',
    title: 'Second task',
    status: 'in-progress',
    priority: 'high',
  },
]

describe('task mutation boundary', () => {
  it('appends a task without mutating the input collection', () => {
    const nextTask: Task = {
      id: 'FOR-3',
      projectId: 'project-1',
      title: 'Third task',
      status: 'backlog',
      priority: 'low',
    }

    const result = appendTask(tasks, nextTask)

    expect(result).toEqual([...tasks, nextTask])
    expect(result).not.toBe(tasks)
  })

  it('updates writable values while preserving task identity', () => {
    const result = updateTaskValues(tasks, 'FOR-1', {
      title: 'Updated task',
      status: 'done',
      priority: 'urgent',
      description: 'Updated description',
    })

    expect(result[0]).toEqual({
      id: 'FOR-1',
      projectId: 'project-1',
      title: 'Updated task',
      status: 'done',
      priority: 'urgent',
      description: 'Updated description',
    })
    expect(result[1]).toBe(tasks[1])
  })

  it('moves only the targeted task', () => {
    const result = moveTaskToStatus(tasks, 'FOR-1', 'done')

    expect(result[0]?.status).toBe('done')
    expect(result[1]).toBe(tasks[1])
  })

  it('removes a task and captures its original position', () => {
    const result = removeTask(tasks, 'FOR-1')

    expect(result.tasks).toEqual([tasks[1]])
    expect(result.deletedTask).toEqual({ task: tasks[0], index: 0 })
  })

  it('returns the original collection when removing an unknown task', () => {
    const result = removeTask(tasks, 'missing')

    expect(result.tasks).toBe(tasks)
    expect(result.deletedTask).toBeNull()
  })

  it('restores a deleted task at its previous position', () => {
    const removed = removeTask(tasks, 'FOR-1')
    expect(removed.deletedTask).not.toBeNull()

    const result = restoreTask(
      removed.tasks,
      removed.deletedTask as NonNullable<typeof removed.deletedTask>,
    )

    expect(result).toEqual(tasks)
  })

  it('does not restore a duplicate task', () => {
    const result = restoreTask(tasks, { task: tasks[0] as Task, index: 0 })

    expect(result).toBe(tasks)
  })
})
