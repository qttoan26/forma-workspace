# Frontend module map

Forma Workspace is a workspace-first operating platform. The frontend navigation exposes stable module boundaries before detailed workflows are implemented so the product can grow without repeatedly changing its information architecture.

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
