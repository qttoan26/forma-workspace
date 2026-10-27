import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

import { HomePage } from '@/pages/home/home-page'
import { ProjectBoardPage } from '@/pages/project-board/project-board-page'
import { parseProjectBoardSearch } from '@/pages/project-board/project-board-search'

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
  validateSearch: parseProjectBoardSearch,
  component: ProjectBoardPage,
})

const routeTree = rootRoute.addChildren([homeRoute, projectRoute])
export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
