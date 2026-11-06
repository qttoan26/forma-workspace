# ADR-001: TanStack tables, dnd-kit and the glass workspace shell

- Status: Accepted
- Date: 2026-11-01

## Context

Forma remains a frontend-first workspace for multi-department operations, documents, automation and vendor collaboration. The user requested TanStack libraries where useful, dnd-kit for drag and drop, and Bitrix-inspired blur/transparency using UI/UX Pro Max. This slice builds on the sidebar and breadcrumb fixes in PR #133.

## Decision

- Keep TanStack Router for route/search ownership and TanStack Virtual for large board columns. Use TanStack Table v8 for project inventory sorting and pagination. Introduce other TanStack libraries only when a real use case warrants them; TanStack Query remains the intended server-cache owner when APIs require it.
- Keep `widgets/task-table` domain-aware and dependent on task/member entities. The project page owns route composition, global filters and the shared task editor. Table sorting/page size are local presentation state in this slice; project filters, view and selected task retain existing URL ownership.
- Use dnd-kit Core for cross-status task moves. Handles support mouse, touch and keyboard input; preserve the visible Move to select as an alternative. Commit through the existing `moveTaskToStatus` and persistence adapter only after a valid drop. Escape/outside drops do not write. Same-column ordering is intentionally unchanged because the task model has no persisted rank.
- Retain current architecture, green accent, system font stack, storage adapters, module boundaries and implementation placeholders. Backend expansion remains paused.
- Put glass colors, borders, background and blur into semantic tokens. Apply backdrop blur to navigation and search overlays; avoid a filter on every task card or table row. Content surfaces retain strong opacity for text readability. Supply opaque defaults without backdrop-filter support, honor reduced transparency, and retain reduced motion.

## UI/UX Pro Max application

Reviewed the upstream [SKILL.md](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/bf41cbc3ce63e30c922e58ef48741ba6133f9aa9/.claude/skills/ui-ux-pro-max/SKILL.md), quick reference and professional rules. Ran the system-wide `enterprise dashboard glassmorphism` search, a focused `glassmorphism` style search, `dragging movements` UX search and React `table memoization` stack search. The system-wide search's landing-page layout/dark palette did not fit the approved workspace; the verified glass style and dragging-accessibility recommendations apply, with existing Forma typography/color retained. No generated design-system output replaces existing product decisions.

Applied: 16px navigation blur, light borders, layered background, visible focus, labelled drag handles, activation thresholds, keyboard status navigation, cancellation, pointer alternative, semantic table headers with `aria-sort`, readable text and mobile containment. Table v8/Virtual widgets explicitly opt out of React Compiler's incompatible-library lint, following the existing Virtual exception.

## Consequences

The table gains real sorting and bounded rendered rows rather than another custom table engine. Dragging reuses the same data ownership and durable storage as existing status edits. There is a bundle cost for Table and dnd-kit; browser smoke and performance checks remain necessary. This is an implemented frontend slice, not a declaration that every module or Task 70 is complete.

Table is loaded as a separate chunk when selected (about 53.8 kB minified / 14.6 kB gzip in the local build), with an accessible loading fallback. The project header and task action layout use a denser workspace presentation.

## Alternatives considered

Custom table/drag engines would duplicate tested library behavior. Installing every TanStack package in advance adds unused dependencies. Making every card highly transparent or individually blurred adds compositing cost and reduces readability.
