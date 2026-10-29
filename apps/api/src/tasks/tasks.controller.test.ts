import { BadRequestException } from '@nestjs/common'

import { InMemoryTaskRepository } from './task.repository'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

const task = {
  id: 'FOR-501',
  projectId: 'project-forma',
  title: 'Persist API tasks',
  status: 'todo' as const,
  priority: 'high' as const,
}

function createSubject() {
  const repository = new InMemoryTaskRepository()
  const service = new TasksService(repository)
  const controller = new TasksController(service)

  return { controller, service }
}

describe('TasksController', () => {
  it('replaces and reads a project task collection', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] })

    await expect(controller.getProjectTasks(task.projectId)).resolves.toEqual({
      tasks: [task],
    })
  })

  it('isolates task collections by project', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] })

    await expect(
      controller.getProjectTasks('another-project'),
    ).resolves.toEqual({
      tasks: [],
    })
  })

  it('rejects tasks for a different project', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks('another-project', { tasks: [task] }),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects duplicate task ids', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks(task.projectId, { tasks: [task, task] }),
    ).rejects.toThrow(BadRequestException)
  })
})
