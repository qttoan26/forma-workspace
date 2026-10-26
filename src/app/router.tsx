import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

import { taskPriorities, type TaskPriority } from '@/entities/task/model/task'
import { HomePage } from '@/pages/home/home-page'
import { ProjectBoardPage } from '@/pages/project-board/project-board-page'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Outlet />
    </>
  ),
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceSlug/projects/$projectId',
  validateSearch: (search: Record<string, unknown>) => ({
    ...(isTaskPriority(search.priority) ? { priority: search.priority } : {}),
    ...(typeof search.assignee === 'string' && search.assignee
      ? { assignee: search.assignee }
      : {}),
  }),
  component: ProjectBoardPage,
})

const routeTree = rootRoute.addChildren([homeRoute, projectRoute])
export const router = createRouter({ routeTree })

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === 'string' && taskPriorities.includes(value as TaskPriority)
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
