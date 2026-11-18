import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

import { RouterErrorBoundary } from '@/app/router-error-boundary'
import { AuthCallbackPage } from '@/pages/auth-callback/auth-callback-page'
import { HomePage } from '@/pages/home/home-page'
import { LandingPage } from '@/pages/landing/landing-page'
import { LoginPage } from '@/pages/login/login-page'
import { ModuleRoutePage } from '@/pages/module/module-route-page'
import {
  compactWorkTaskSearch,
  parseWorkTaskSearch,
} from '@/pages/module/work-task-filters'
import { loadProjectBoard } from '@/pages/project-board/project-board-loader'
import { ProjectBoardLoading } from '@/pages/project-board/project-board-loading'
import { ProjectBoardNotFound } from '@/pages/project-board/project-board-not-found'
import { ProjectBoardPage } from '@/pages/project-board/project-board-page'
import { parseProjectBoardSearch } from '@/pages/project-board/project-board-search'
import { requireAuthSession } from '@/shared/auth/auth-session'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          const main = document.getElementById('main-content')
          if (!main) return

          // A fragment navigation can reload route state and replace the focus target.
          event.preventDefault()
          main.focus()
          main.scrollIntoView()
        }}
      >
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

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
})

function parseModuleSearch(search: Record<string, unknown>) {
  return {
    ...compactWorkTaskSearch(parseWorkTaskSearch(search)),
    ...(typeof search.project === 'string' &&
    search.project.trim() &&
    search.project !== 'project-1'
      ? { project: search.project }
      : {}),
  }
}

const moduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/modules/$moduleId',
  validateSearch: parseModuleSearch,
  beforeLoad: requireAuthSession,
  component: ModuleRoutePage,
})

const moduleSectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/modules/$moduleId/$sectionId',
  validateSearch: parseModuleSearch,
  beforeLoad: requireAuthSession,
  component: ModuleRoutePage,
})

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceSlug/projects/$projectId',
  beforeLoad: requireAuthSession,
  validateSearch: parseProjectBoardSearch,
  loader: ({ params, context }) =>
    loadProjectBoard({
      workspaceSlug: params.workspaceSlug,
      projectId: params.projectId,
      accountId: context.user.id,
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
  authCallbackRoute,
  moduleRoute,
  moduleSectionRoute,
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
