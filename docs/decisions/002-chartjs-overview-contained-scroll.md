# ADR-002: Chart.js overview analytics and contained data scrolling

- Status: Accepted
- Date: 2026-11-01

## Context

The user requested Chart.js dashboards/overviews and scrolling inside tables or lists. Forma remains frontend-first and keeps existing task ownership and browser persistence. Home and Work Overview have a real project task snapshot; Production, Documents and other unfinished modules do not yet have operational datasets.

## Decision

- Use Chart.js directly with only the required controllers, elements, scales and tooltip plugin registered. `widgets/work-insights` owns presentation and task/member aggregation; its lazy wrapper keeps Chart.js out of unrelated views. No second React chart wrapper or analytics store is introduced.
- Home and Work Overview show a task-status doughnut and a stacked horizontal owner-workload chart. Counts reconcile to the same saved tasks as the board. Unknown/missing owners appear as Unassigned; zero-task and completed-only snapshots remain valid. Workload means task counts, not hours, utilization or production capacity.
- Keep visible status counts, completion text, labelled canvases and an expandable workload data table. Dedicated canvas containers support responsive rendering. Charts have animation disabled and instances are destroyed on data replacement/unmount.
- Put KPIs and charts before module navigation on Home. Leave unfinished module placeholders explicit; do not invent production metrics, histories or trends.
- Share the existing TanStack Table with Work Tasks, My Tasks and current-task summaries, retaining real task links and the project editor's button behavior. Sorting and pagination stay in the widget; chart totals cover the full snapshot rather than the current page.
- Introduce `shared/ui/scroll-region` as a keyboard-focusable, named, bounded scroll container. Use it for data tables, project lists/calendar/timeline/files, Work schedules, attention lists and long chart data. Sticky table headers and pagination outside the scrolling body preserve navigation. Kanban columns keep their status headers outside the scrolling task list, including virtualized lists.

## Consequences

Data-heavy content no longer grows the whole page without a bound. The page itself still scrolls between dashboard sections; no full-page scroll lock is added. Native keyboard, wheel, touch and horizontal table scrolling remain available. Chart.js adds an on-demand chunk (approximately 158 kB minified / 55 kB gzip in the local build); existing Vite bundle advice still applies to the main app.

## Verification

Coverage includes status/owner reconciliation, empty/completed-only data, readable chart equivalents, chart cleanup, direct task links, real canvas drawing, updating overview after saved edits, vertical table scrolling without moving the page, sticky headers, pagination, keyboard list scrolling, board-column containment and a 375px chart layout. Existing drag/drop, navigation, drawer, persistence and virtualized-board checks remain part of release verification.

Implementation references: [Chart.js integration](https://www.chartjs.org/docs/latest/getting-started/integration.html), [responsive charts](https://www.chartjs.org/docs/latest/configuration/responsive.html), [canvas accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html).
