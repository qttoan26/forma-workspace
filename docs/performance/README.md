# Performance Engineering

Performance is a product requirement for Forma Workspace, especially for data-heavy project and task interfaces.

## Initial targets

- Lighthouse Performance: >= 95 on the agreed reference environment.
- Lighthouse Accessibility: >= 95.
- LCP: < 1.5 s.
- CLS: < 0.05.
- INP: < 150 ms.
- Avoid long main-thread tasks above 50 ms during common interactions where practical.
- Common local UI interactions should target < 100 ms response latency.

Targets are engineering budgets, not claims about every device or network.

## Dataset benchmarks

Data-heavy views should be evaluated with representative datasets including approximately:

- 1,000 tasks
- 10,000 tasks
- 50,000 tasks
- 100,000 tasks

Measurements should include interaction latency, rendered DOM size, memory behavior, long tasks, and virtualization effectiveness where applicable.

## Task board baseline

The first benchmark isolates task-board data transforms before introducing browser rendering measurements. It measures the production code paths used for:

- filtering tasks by search, priority, and assignee;
- grouping visible tasks into workflow columns;
- moving one task to another status.

Run it with:

```sh
npm run benchmark:task-board
```

The benchmark covers 1K, 10K, 50K, and 100K synthetic tasks. The GitHub `Performance Baseline` workflow runs the same command on relevant pull requests and on manual dispatch.

This benchmark is intentionally non-gating. Shared CI runners are useful for trend visibility but are not stable enough to enforce tight millisecond thresholds. Regressions should be investigated by comparing repeated runs on the same reference environment.

## Browser benchmark next

Data transforms are only one part of board performance. The next stage should add a browser-level harness for the real board UI and record:

- initial render and commit duration;
- DOM node count;
- interaction latency when filtering and moving a task;
- long tasks on the main thread;
- memory behavior while switching datasets;
- the point at which virtualization materially improves latency and DOM size.

Virtualization should be introduced only after the browser benchmark demonstrates a measurable bottleneck.

## Method

Performance work should compare a documented baseline against a change. Optimizations should solve measured bottlenecks rather than rely on framework folklore.
