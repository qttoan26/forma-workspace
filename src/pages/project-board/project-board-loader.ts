import { notFound } from '@tanstack/react-router'

import {
  ProjectBoardNotFoundError,
  projectBoardRepository,
  type GetProjectBoardInput,
} from './project-board-repository'

export async function loadProjectBoard(input: GetProjectBoardInput) {
  try {
    return await projectBoardRepository.getProjectBoard(input)
  } catch (error) {
    if (error instanceof ProjectBoardNotFoundError) {
      throw notFound({ data: error.input })
    }

    throw error
  }
}
