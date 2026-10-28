import { loadProjectTasks } from './task-storage'
import {
  createBrowserTaskMutationAdapter,
  createTaskMutationEffectBoundary,
  type TaskMutationAdapter,
} from './task-mutation-adapter'

import type { Task } from '../model/task'

const task: Task = {
  id: 'FOR-501',
  projectId: 'project-forma',
  title: 'Persist async mutation boundary',
  status: 'todo',
  priority: 'high',
}

describe('task mutation effect boundary', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('skips the initial synchronization and persists later task changes', async () => {
    const adapter = createBrowserTaskMutationAdapter(window.localStorage)

    await expect(
      adapter.persist(task.projectId, [task]),
    ).resolves.toBeUndefined()
    expect(loadProjectTasks(task.projectId, [])).toEqual([])

    const updatedTask = { ...task, status: 'done' as const }
    await expect(
      adapter.persist(task.projectId, [updatedTask]),
    ).resolves.toBeUndefined()

    expect(loadProjectTasks(task.projectId, [])).toEqual([updatedTask])
  })

  it('captures adapter failures without leaking a rejected promise', async () => {
    const failure = new Error('network unavailable')
    const onFailure = vi.fn<(error: unknown) => void>()
    const failingAdapter: TaskMutationAdapter = {
      persist: vi.fn().mockRejectedValue(failure),
    }
    const adapter = createTaskMutationEffectBoundary(failingAdapter, onFailure)

    await adapter.persist(task.projectId, [task])
    await expect(
      adapter.persist(task.projectId, [task]),
    ).resolves.toBeUndefined()

    expect(onFailure).toHaveBeenCalledWith(failure)
  })
})
