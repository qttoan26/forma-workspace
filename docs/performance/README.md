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

## Task board data baseline

The first benchmark isolates task-board data transforms. It measures the production code paths used for:

- filtering tasks by search, priority, and assignee;
- grouping visible tasks into workflow columns;
- moving one task to another status.

Run it with:

```sh
npm run benchmark:task-board
```

The benchmark covers 1K, 10K, 50K, and 100K synthetic tasks. The GitHub `Performance Baseline` workflow runs the same command on relevant pull requests and on manual dispatch.

### Reference run

Reference environment: GitHub Actions `ubuntu-24.04`, Node `22.23.3`, Vitest `3.2.7`. Values below are mean execution time from the October 26, 2026 baseline run.

|   Tasks | Filter + group | Move one task |
| ------: | -------------: | ------------: |
|   1,000 |      0.0122 ms |     0.0082 ms |
|  10,000 |      0.1314 ms |     0.0830 ms |
|  50,000 |      0.7338 ms |     0.8845 ms |
| 100,000 |      1.5775 ms |     1.8773 ms |

These numbers show the current data transforms remain well below the UI interaction budget even at 100K tasks. They do **not** prove the rendered board can handle 100K DOM-backed cards efficiently; browser rendering is expected to become the more important bottleneck.

This benchmark is intentionally non-gating. Shared CI runners are useful for trend visibility but are not stable enough to enforce tight millisecond thresholds. Regressions should be investigated by comparing repeated runs on the same reference environment.

## Task board browser baseline

The browser benchmark renders the real `TaskBoard` in a production Vite build and drives it with headless Chromium through Playwright. The harness disables task persistence so large synthetic datasets do not measure local-storage serialization or hit browser storage quotas.

Run the default 1K and 10K scenarios with:

```sh
npx playwright install chromium
npm run benchmark:browser
```

Override the dataset list when investigating larger scenarios:

```sh
FORMA_BROWSER_TASK_COUNTS=1000,10000,50000 npm run benchmark:browser
```

The harness records:

- React Profiler mount actual and base duration;
- rendered DOM node and task-card counts;
- browser-side wall latency for a filter update;
- browser-side wall latency for moving a task;
- React update duration for those interactions;
- observed long tasks;
- JavaScript heap usage when Chromium exposes it.

The `Browser Performance` workflow runs 1K and 10K scenarios on relevant pull requests. Larger 50K and 100K scenarios are intentionally manual until the current non-virtualized board demonstrates that they can run reliably without exhausting shared CI resources.

The browser benchmark is a measurement tool, not a millisecond gate. Virtualization should be introduced only after these measurements identify render, DOM, interaction, or memory pressure that the current board cannot meet within the product budgets.

## Method

Performance work should compare a documented baseline against a change. Optimizations should solve measured bottlenecks rather than rely on framework folklore.
