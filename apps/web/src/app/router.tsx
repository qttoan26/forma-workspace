import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

import { RouterErrorBoundary } from '@/app/router-error-boundary'
import { HomePage } from '@/pages/home/home-page'
import { LandingPage } from '@/pages/landing/landing-page'
import { LoginPage } from '@/pages/login/login-page'
import { loadProjectBoard } from '@/pages/project-board/project-board-loader'
import { ProjectBoardLoading } from '@/pages/project-board/project-board-loading'
import { ProjectBoardNotFound } from '@/pages/project-board/project-board-not-found'
import { ProjectBoardPage } from '@/pages/project-board/project-board-page'
import { parseProjectBoardSearch } from '@/pages/project-board/project-board-search'
import { requireAuthSession } from '@/shared/auth/auth-session'

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
  beforeLoad: requireAuthSession,
  component: HomePage,
})

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/landing',
  component: LandingPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceSlug/projects/$projectId',
  beforeLoad: requireAuthSession,
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

const routeTree = rootRoute.addChildren([
  homeRoute,
  landingRoute,
  loginRoute,
  projectRoute,
])
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
