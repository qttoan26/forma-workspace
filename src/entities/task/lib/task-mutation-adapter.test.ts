import { loadProjectTasks } from './task-storage'
import { createBrowserTaskMutationAdapter } from './task-mutation-adapter'

import type { Task } from '../model/task'

const task: Task = {
  id: 'FOR-501',
  projectId: 'project-forma',
  title: 'Persist async mutation boundary',
  status: 'todo',
  priority: 'high',
}

describe('browser task mutation adapter', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists task collections through the async contract', async () => {
    const adapter = createBrowserTaskMutationAdapter(window.localStorage)

    await expect(adapter.persist(task.projectId, [task])).resolves.toBeUndefined()

    expect(loadProjectTasks(task.projectId, [])).toEqual([task])
  })
})
