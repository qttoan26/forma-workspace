# Router error handling

Forma Workspace keeps missing resources and unexpected failures on separate paths.

- Expected missing project-board resources are mapped from `ProjectBoardNotFoundError` to TanStack Router `notFound()` at the route-loader boundary.
- Route-level 404s render their dedicated `notFoundComponent`.
- Unexpected loader, rendering, and runtime failures fall through to the router-level `defaultErrorComponent`.
- The global error boundary retries loader failures through `router.invalidate()` so the route is reloaded and the error boundary resets together.
- The fallback uses a plain home anchor so navigation remains available even when router state is unhealthy.

This separation keeps repository/domain errors independent from routing concerns while giving users distinct recovery paths for missing data versus system failures.
