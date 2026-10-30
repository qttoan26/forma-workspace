import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Put,
} from '@nestjs/common'

import { persistTasksBodySchema } from './task.schema'
import { ProjectTaskRevisionConflictError } from './task.repository'
import { TasksService } from './tasks.service'

@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getProjectTasks(@Param('projectId') projectId: string) {
    return this.tasksService.getProjectTasks(projectId)
  }

  @Put()
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

    try {
      const revision = await this.tasksService.replaceProjectTasks(
        projectId,
        parsed.data.tasks,
        parsed.data.expectedRevision,
      )

      return { revision }
    } catch (error) {
      if (error instanceof ProjectTaskRevisionConflictError) {
        throw new ConflictException({
          message: 'Project task revision conflict',
          expectedRevision: error.expectedRevision,
          actualRevision: error.actualRevision,
        })
      }

      throw error
    }
  }
}
