import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

import { RouterErrorBoundary } from '@/app/router-error-boundary'
import { HomePage } from '@/pages/home/home-page'
import { LandingPage } from '@/pages/landing/landing-page'
import { loadProjectBoard } from '@/pages/project-board/project-board-loader'
import { ProjectBoardLoading } from '@/pages/project-board/project-board-loading'
import { ProjectBoardNotFound } from '@/pages/project-board/project-board-not-found'
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

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/landing',
  component: LandingPage,
})

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceSlug/projects/$projectId',
  validateSearch: parseProjectBoardSearch,
  loader: ({ params }) =>
    loadProjectBoard({
      workspaceSlug: params.workspaceSlug,
      projectId: params.projectId,
    }),
  component: ProjectBoardPage,
  pendingComponent: ProjectBoardLoading,
  pendingMs: 200,
  pendingMinMs: 300,
  notFoundComponent: ProjectBoardNotFound,
})

const routeTree = rootRoute.addChildren([homeRoute, landingRoute, projectRoute])
const basepath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createRouter({
  routeTree,
  basepath,
  defaultErrorComponent: RouterErrorBoundary,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
