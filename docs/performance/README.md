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

The production harness records:

- wall time from benchmark bootstrap through the mounted board becoming paint-ready;
- rendered DOM node and task-card counts;
- browser-side wall latency from a filter event through the observable DOM commit;
- browser-side wall latency from a move event through the card appearing in the target column;
- observed long tasks;
- JavaScript heap usage when Chromium exposes it.

The `Browser Performance` workflow runs 1K and 10K scenarios on relevant pull requests. Larger 50K and 100K scenarios remain manual because the current non-virtualized board already shows material DOM and render pressure at 10K tasks.

### Reference browser run

Reference environment: GitHub Actions `ubuntu-24.04`, Node `22.23.3`, Playwright Chromium / Chrome for Testing `156.0.8078.4`. Values below are from the October 26, 2026 production-build baseline run.

|  Tasks | Mount wall time | DOM nodes | Filter latency | Move latency | Observed long tasks | Heap snapshot* |
| -----: | --------------: | --------: | -------------: | -----------: | ------------------: | -------------: |
|  1,000 |        372.6 ms |    17,037 |        53.0 ms |      14.2 ms |               96 ms |       ~10.0 MB |
| 10,000 |       3,302.1 ms |   170,037 |       289.3 ms |      28.4 ms | 694 ms, 67 ms, 264 ms |       ~44.7 MB |

\* Chromium may quantize `performance.memory`, so heap values are directional rather than precise memory accounting.

### Decision

The browser baseline demonstrates that the primary scaling bottleneck is rendering and DOM volume rather than task filtering or grouping. At 10K tasks the board creates roughly 170K DOM nodes, mount time grows to about 3.3 seconds, filter latency exceeds the <100 ms local-interaction budget, and long main-thread tasks reach hundreds of milliseconds.

This is sufficient evidence to introduce virtualization for large board columns. The next optimization should preserve behavior and accessibility while reducing mounted task-card and DOM counts, then compare the same 1K and 10K scenarios against this baseline before expanding to 50K and 100K browser datasets.

The browser benchmark remains a measurement tool rather than a tight millisecond CI gate because shared runners vary between executions.

## Method

Performance work should compare a documented baseline against a change. Optimizations should solve measured bottlenecks rather than rely on framework folklore.
