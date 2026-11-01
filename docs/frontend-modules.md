# Frontend module map

Forma Workspace is a workspace-first operating platform. The frontend navigation exposes stable module boundaries before detailed workflows are implemented so the product can grow without repeatedly changing its information architecture.

The workspace shell now uses Bitrix-inspired glass tokens and a layered cyan/mint background. Project Table uses TanStack Table for sorting and pagination; Board uses dnd-kit handles for cross-status moves with mouse/touch/keyboard and retains Move to controls. Both reuse existing task ownership and persistence. Module placeholders remain explicit; this upgrade does not add backend models or claim unfinished module detail is complete.

Home and Work Overview now share Chart.js task-status and owner-workload analytics from the saved project snapshot. Home puts actionable KPIs/charts before module navigation. Work Tasks/My Tasks/current-task tables reuse TanStack Table. Data tables and lists, including calendar/timeline/files, attention lists and board columns, scroll inside bounded containers; table headers stay sticky and pagination sits outside the scrolling body.

## Module boundaries

- **Work** — Projects, tasks, priorities, ownership, and cross-team execution. Foundation available through the existing project board.
- **Production** — Production queues, processing stages, workload, and delivery visibility. Implementation in progress.
- **Documents & Data** — Intake, scan/OCR, structured data, review, and handoff. Implementation in progress.
- **Automation** — Triggers, workflows, approvals, reusable automations, and monitoring. Implementation in progress.
- **Vendors** — Vendor/BPO collaboration, assignment, and delivery tracking. Implementation in progress.
- **Customers** — Customer workspaces, requests, and service delivery visibility. Implementation in progress.
- **Policy & Compliance** — SOP, policy, approval, audit, and compliance controls. Implementation in progress.
- **Admin** — Organization, teams, roles/access, integrations, and workspace settings. Implementation in progress.

## Frontend layering

The existing layered structure remains valid:

- `app/`: routing, application bootstrap, error boundaries, global styles.
- `pages/`: route-level composition only.
- `widgets/`: reusable page sections and navigation shells.
- `features/`: user actions and business capabilities that can appear in multiple pages.
- `entities/`: domain entities and entity-level UI/data logic.
- `shared/`: design primitives, infrastructure, auth, storage, configuration, and module registry.

Module names are product navigation boundaries, not a replacement for the technical layers above. A module page may compose several features/entities while cross-module primitives stay in `shared/` or `widgets/`.

## Implementation sequence

1. Stabilize workspace navbar and module registry.
2. Expose module landing shells and clearly label unfinished detail flows as `Implementation in progress`.
3. Keep the current project board under Work as the first production feature.
4. Implement detailed workflows one module at a time based on business priority.
5. Add permissions and backend integration at feature boundaries instead of coupling them to navigation.

This keeps the product aligned with the original goal: one workspace for multi-department operations, with document digitization, automation, internal work, vendor collaboration, customer delivery, and governance growing on a stable frontend foundation.

## Sidebar and section detail contract

The Bitrix-inspired sidebar owns module navigation and nested section links. The selected module remains highlighted while its section is active, including project detail routes under Work → Projects. The desktop icon rail expands into section navigation; mobile uses an off-canvas menu with focus containment, Escape dismissal, and focus restoration. Expansion preference is stored locally.

`module-section-registry.ts` and `work-section-registry.ts` define the visible section names, routes, descriptions, and availability. A section URL renders that section's title and content. Invalid sections show a not-found state instead of silently rendering a module overview. Admin owns organization, teams, access, integrations, and workspace settings; Work shows project members only. The legacy Work/Teams URL remains an implementation notice.

Work overview, tasks, My Tasks, projects, deadlines, and delivery sequence read the same project repository and saved task collection as the project board. Task links open the existing task drawer. Dashboard metrics derive from that collection too. The demo explicitly identifies its sample workspace; authenticated My Tasks requires a matching member identity. Inbox now provides browser-local triage from saved task activity and current assignments; unconnected operational sections remain labeled `Implementation in progress`. Counts derive from real current items; assignment snapshots do not invent an actor or date.

Current Work scope is the existing project catalog entry, not a completed cross-project aggregation service. Calendar and Timeline summarize task due dates and link to the existing project views. Multi-project discovery, notifications, and account-to-member mapping remain follow-up work.

The project page keeps its persistence failure callback stable across task drawer URL changes so the mutation adapter does not reset and skip a saved edit when returning to a sidebar section. The smoke flow verifies this round trip.

## Quick navigation search

The topbar search opens a modal with `Ctrl/Cmd + K` or the Search button. It searches module names, sidebar section names, parent context, and descriptions from the same navigation registries. Exact and prefix name matches rank first; every destination retains its module context and implementation status. It searches navigation, not task or document content.

Type to filter, use Up/Down to move between results, Enter to open the first match from the input or the focused destination, and Escape to close and restore focus. Native modal behavior contains keyboard focus; background scroll is restored on close. The mobile topbar exposes the same action. Links use Vite's application base path so the existing GitHub Pages fallback can resolve direct section URLs.

The search index is static module metadata, not a second business-data store. New sidebar sections enter search through their registry; no additional API, storage engine, or UI library is introduced.

## Navigation chrome and motion

Page context lives in the shared topbar and sidebar; module content does not add another breadcrumb row. Project detail keeps a single Projects back link in its header. Unfinished detail pages show one page title and one implementation status, followed by the relevant planned capabilities.

Sidebar widths and main-content offset share one size variable, duration, and easing curve. The inner menu keeps a fixed expanded width so labels do not wrap or icons shift during a transition. Each module uses one persistent disclosure button and submenu; closed submenus remain mounted for the grid-height animation but are inert and removed from the accessibility tree. This keeps keyboard focus on the same trigger when expanding from the icon rail and allows an in-flight transition to reverse without timers.

Desktop rail, submenu, and mobile drawer motion use a shared 260 ms transition. Label fades use 160 ms. `prefers-reduced-motion` sets both durations to zero. All shell/sidebar styling is owned by `workspace-shell.css`; the older sidebar override file has been removed.

## Priority rollout and Work completion increment

See [module priorities](module-priorities.md) for the high-to-low implementation queue and explicit completion boundaries. Tasks/My Tasks now support URL-backed triage filters and All/Open/Overdue/Completed scopes using the shared task table. Project cards show task completion and link directly to every existing project view. Activity is available for saved comments and detail updates in the current project on this browser; it reads the existing IndexedDB activity store and refreshes across tabs. It is not a server notification or audit service. Inbox is available for current-project browser-local activity, current assignments and inline replies; organization Teams and unconnected operational modules retain explicit implementation status. See [Inbox source and persistence boundaries](decisions/003-browser-local-inbox.md).
