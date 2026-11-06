# ADR-005: Browser-local Production intake and queue

- Status: Accepted
- Date: 2026-11-02

## Context

Work coordinates tasks and Documents & Data owns document references. Production needs an operational package and queue without copying those domain models or implying that processing, OCR, quality review or delivery services are connected. The frontend-first scope remains a multi-department BPO/OCR/operations platform.

## Decision

Add a work-package entity with a name, work type, requirements, Work task IDs, optional document-reference IDs, owner ID, priority, due date and explicit Draft/Queued state. New packages start in Draft. Users can edit plans, queue a saved package, return it to Draft or confirm removal. Source tasks/documents are never deleted or updated by these actions. No packages are preseeded or inferred from task status.

The current-project intake and queue share one project-scoped localStorage collection. The adapter re-reads that collection for each mutation, validates schemas/project scope and compares the expected package revision. Web Locks serialize cooperating same-origin tabs; a per-project promise chain serializes writes within a tab when Web Locks is unavailable. That fallback does not guarantee cross-tab atomicity.

Creation, editing and queueing obtain fresh Work/document/member context inside the package-write lock and validate selected IDs. Source-store writes are independent transactions: a source removed after validation can make a saved package unavailable, so the UI also checks current sources and marks affected packages as needing attention. Users repair those selections before saving or queueing. Returning to Draft and removing a package do not require source validation. Queue-state actions are disabled while an editor has unsaved changes.

Package views refresh on same-tab saves, cross-tab storage events and focus. Failed/corrupt reads pause editing; write failures retain inputs and never announce success. Stored text renders as text. Removing a package requires confirmation and only removes its local planning record.

## Consequences

- Intake and queues are manual browser-local planning, not an execution runner, shared multi-user queue, audit log or server-enforced access system.
- Work types cover general operations, scanning, OCR preparation, data entry and BPO.
- TanStack Table provides sorting, filtering, pagination and contained scrolling. The native modal supports Escape and focus restoration; source lists scroll internally.
- Scope remains the existing project catalog entry. Manual Processing/Quality planning is added in [ADR-006](006-production-processing-quality.md); delivery retains its implementation notice; backend expansion remains separate from frontend hardening.
- No dependency or backend API changes.

## Alternatives considered

Reusing Work status was rejected because operational queueing is a different domain action. Copying task/file content was rejected to preserve ownership. Remote execution is deferred until authoritative identity, storage and execution services exist.
