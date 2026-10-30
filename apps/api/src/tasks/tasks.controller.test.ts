import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { InMemoryTaskRepository } from './task.repository'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

const owner = { id: 'user-owner' }
const anotherUser = { id: 'user-another' }

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
      controller.replaceProjectTasks(task.projectId, { tasks: [task] }, owner),
    ).resolves.toEqual({ revision: 1 })

    await expect(
      controller.getProjectTasks(task.projectId, owner),
    ).resolves.toEqual({
      tasks: [task],
      revision: 1,
    })
  })

  it('increments the revision after each successful replacement', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks(task.projectId, { tasks: [task] }, owner),
    ).resolves.toEqual({ revision: 1 })
    await expect(
      controller.replaceProjectTasks(
        task.projectId,
        {
          tasks: [task],
          expectedRevision: 1,
        },
        owner,
      ),
    ).resolves.toEqual({ revision: 2 })
  })

  it('rejects a stale expected revision without replacing tasks', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] }, owner)

    await expect(
      controller.replaceProjectTasks(
        task.projectId,
        {
          tasks: [],
          expectedRevision: 0,
        },
        owner,
      ),
    ).rejects.toThrow(ConflictException)

    await expect(
      controller.getProjectTasks(task.projectId, owner),
    ).resolves.toEqual({
      tasks: [task],
      revision: 1,
    })
  })

  it('isolates task collections by project', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] }, owner)

    await expect(
      controller.getProjectTasks('another-project', owner),
    ).resolves.toEqual({
      tasks: [],
      revision: 0,
    })
  })

  it('does not reveal another users project snapshot', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] }, owner)

    await expect(
      controller.getProjectTasks(task.projectId, anotherUser),
    ).resolves.toEqual({
      tasks: [],
      revision: 0,
    })
  })

  it('prevents another user from replacing an owned project', async () => {
    const { controller } = createSubject()

    await controller.replaceProjectTasks(task.projectId, { tasks: [task] }, owner)

    await expect(
      controller.replaceProjectTasks(
        task.projectId,
        { tasks: [], expectedRevision: 1 },
        anotherUser,
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('rejects tasks for a different project', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks('another-project', { tasks: [task] }, owner),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects duplicate task ids', async () => {
    const { controller } = createSubject()

    await expect(
      controller.replaceProjectTasks(
        task.projectId,
        { tasks: [task, task] },
        owner,
      ),
    ).rejects.toThrow(BadRequestException)
  })
})
