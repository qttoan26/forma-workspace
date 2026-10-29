import { BadRequestException, Body, Controller, HttpCode, Param, Put } from '@nestjs/common'

import { persistTasksBodySchema } from './task.schema'
import { TasksService } from './tasks.service'

@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Put()
  @HttpCode(204)
  replaceProjectTasks(@Param('projectId') projectId: string, @Body() body: unknown) {
    const parsed = persistTasksBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException('Invalid task collection')
    }

    if (parsed.data.tasks.some((task) => task.projectId !== projectId)) {
      throw new BadRequestException('Task projectId must match the route projectId')
    }

    this.tasksService.replaceProjectTasks(projectId, parsed.data.tasks)
  }
}
