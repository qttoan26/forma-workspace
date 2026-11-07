# Frontend progress

The fixed frontend master backlog remains **70 tasks**.

## Verified progress

- Completed: **70 / 70**
- Remaining: **0 / 70**
- Completion: **100%**

This count follows the previously agreed fixed backlog. Backend work is not counted as frontend progress.

## Completed frontend work

### Task 69 — Forma UI consolidation

Completed and validated:

- preserved the approved dashboard → project board → task experience
- formalized semantic Forma UI tokens without redesigning the approved visual direction
- reduced page-specific style drift across shared, dashboard and project-board surfaces
- kept pages-first architecture with shared styling only where it is earned
- CI passed typecheck, lint, formatting, tests and production build
- performance baseline and browser performance workflows passed

### Task 70 — Production frontend hardening

[PR #147](https://github.com/qttoan26/forma-workspace/pull/147) landed on `main` as `dcfec4f`. CI passed 245 web tests, 39 API tests, 57 Chromium smoke tests, typecheck, lint, formatting, production build, and both performance workflows. Coverage includes loading, unexpected-error and persistence-error regressions.

After merge, the [GitHub Pages deployment](https://qttoan26.github.io/forma-workspace/) served the verified build under `/forma-workspace/`. The deployed dashboard loaded, a direct task link opened the editor again after reload, a missing project rendered its own fallback and returned to the dashboard, and the skip link moved keyboard focus into the missing-project content without changing the route.

## Next phase

### Frontend extension — Projects

Work → Projects now supports browser-local project creation and discovery,
URL-backed search, live per-project task summaries and all existing project
views. Work sections and project pages can switch projects without carrying
another project's task state. Home links to saved projects. Catalog records are
scoped by account, workspace and deployment; duplicate keys are checked in one
IndexedDB transaction. See [the scope and remaining integration work](decisions/008-browser-local-project-catalog.md).

This extension does not change the fixed **70/70** frontend foundation count.
Next frontend integration: project context selection in Documents and Production.
Server project discovery, project membership and cross-device catalog sync need
an authoritative API.

Continue with the existing NestJS and MongoDB API. [PR #96](https://github.com/qttoan26/forma-workspace/pull/96) replaced PostgreSQL task persistence. Start delivery work with [server-owned organization membership](decisions/007-external-delivery-milestones.md#first-backend-slice) before enabling external milestones.
