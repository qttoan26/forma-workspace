# Glass UI, TanStack Table and dnd-kit validation

Date: 2026-11-01. Branch: `feat/glass-ui-tanstack-dnd`.

## Local results

- Frontend: 185 tests passed across 56 files, including semantic sorting, severity ordering, undated tasks, page clamping after filtering, empty state and task opening.
- API: 39 tests passed; no API implementation changes.
- Typecheck, zero-warning lint, Prettier and production builds passed.
- Production frontend smoke: 23 tests passed in one final run. The five new flows cover table sorting/editor, mouse drag plus reload persistence, keyboard movement into an empty column plus Escape/focus restoration, outside drop cancellation, and mobile containment/reduced motion. Existing sidebar, drawer, navigation-search and deep-link flows also passed.
- Browser performance: both 1K and 10K scenarios passed. The virtualized board initially rendered 36 task cards in each scenario. Data-transform benchmarks also completed for 1K, 10K, 50K and 100K tasks.
- Visual inspection: expanded desktop table and 375px mobile layout. Computed navigation blur is 16px with a 72% opaque light surface. At 375px, document scroll width remains 375px; the table scrolls inside its own region.

## Environment and limits

The standard Playwright Chromium download was unavailable in this environment. Local checks used Chromium 153 supplied by the npm `@sparticuz/chromium` package with a temporary launch configuration outside the repository. Repository test configuration and dependencies do not depend on this workaround. The environment's headless software rendering exposed a timing-sensitive existing sidebar animation test under concurrent checks; the final serial production-smoke run passed all 23 tests.

The main application bundle still exceeds Vite's 500 kB advisory threshold; splitting Table avoids loading its code in other views, but broader route splitting remains future work. These checks do not establish Lighthouse scores or performance on every device.

Local verification does not replace GitHub CI or deployment verification. Release checks must pass on the pull request before merging; the GitHub Pages deployment must be verified against the merged commit before reporting the public website as updated.
