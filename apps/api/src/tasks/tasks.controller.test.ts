import { BadRequestException } from '@nestjs/common'

import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

const task = {
  id: 'FOR-501',
  projectId: 'project-forma',
  title: 'Persist API tasks',
  status: 'todo' as const,
  priority: 'high' as const,
}

describe('TasksController', () => {
  it('replaces a project task collection', () => {
    const service = new TasksService()
    const controller = new TasksController(service)

    controller.replaceProjectTasks(task.projectId, { tasks: [task] })

    expect(service.getProjectTasks(task.projectId)).toEqual([task])
  })

  it('rejects tasks for a different project', () => {
    const service = new TasksService()
    const controller = new TasksController(service)

    expect(() =>
      controller.replaceProjectTasks('another-project', { tasks: [task] }),
    ).toThrow(BadRequestException)
  })

  it('rejects duplicate task ids', () => {
    const service = new TasksService()
    const controller = new TasksController(service)

    expect(() =>
      controller.replaceProjectTasks(task.projectId, { tasks: [task, task] }),
    ).toThrow(BadRequestException)
  })
})
