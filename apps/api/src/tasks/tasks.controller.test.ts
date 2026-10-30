import { BadRequestException, ConflictException } from '@nestjs/common'

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
  it('replaces and reads a project task collection with a revision', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks(task.projectId, { tasks: [task] }),
    ).resolves.toEqual({ revision: 1 })

    await expect(controller.getProjectTasks(task.projectId)).resolves.toEqual({
      tasks: [task],
      revision: 1,
    })
  })

  it('increments the revision after each successful replacement', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks(task.projectId, { tasks: [task] }),
    ).resolves.toEqual({ revision: 1 })
    await expect(
      controller.replaceProjectTasks(task.projectId, {
        tasks: [task],
        expectedRevision: 1,
      }),
    ).resolves.toEqual({ revision: 2 })
  })

  it('rejects a stale expected revision without replacing tasks', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] })

    await expect(
      controller.replaceProjectTasks(task.projectId, {
        tasks: [],
        expectedRevision: 0,
      }),
    ).rejects.toThrow(ConflictException)

    await expect(controller.getProjectTasks(task.projectId)).resolves.toEqual({
      tasks: [task],
      revision: 1,
    })
  })

  it('isolates task collections by project', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] })

    await expect(
      controller.getProjectTasks('another-project'),
    ).resolves.toEqual({
      tasks: [],
      revision: 0,
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
