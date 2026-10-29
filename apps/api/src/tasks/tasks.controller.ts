import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'

import { persistTasksBodySchema } from './task.schema'
import { TasksService } from './tasks.service'

@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getProjectTasks(@Param('projectId') projectId: string) {
    return { tasks: await this.tasksService.getProjectTasks(projectId) }
  }

  @Put()
  @HttpCode(204)
  async replaceProjectTasks(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ) {
    const parsed = persistTasksBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException('Invalid task collection')
    }

    if (parsed.data.tasks.some((task) => task.projectId !== projectId)) {
      throw new BadRequestException(
        'Task projectId must match the route projectId',
      )
    }

    await this.tasksService.replaceProjectTasks(projectId, parsed.data.tasks)
  }
}
