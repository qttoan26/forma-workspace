# Chart.js overview and contained-scroll verification

Date: 2026-11-01. Branch: `feat/chartjs-overview-contained-scroll`.

## Local results

- 190 frontend tests across 58 files passed. New coverage checks status/owner reconciliation, unknown/missing owners, empty/completed-only data, accessible chart equivalents, Chart.js cleanup and shared table task links.
- Typecheck, lint with zero warnings, Prettier and production frontend build passed.
- All 26 production frontend smoke tests passed in the final full run. New scenarios seed 70 tasks, verify non-empty canvas pixels, move a task and verify updated overview totals, test wheel scrolling without moving the page, confirm sticky table headers and pagination, test keyboard list scrolling and bounded board columns, and verify a 375px chart layout.
- Both virtualized-board browser scenarios passed at 1K and 10K tasks. The bounded columns rendered 32 initial cards in each scenario. These runs verify containment remains compatible with TanStack Virtual; timing values are local measurements, not cross-device guarantees.
- Inspected desktop Home and mobile Work Overview screenshots using the production build. Charts use the existing project data; unfinished module foundations retain their implementation labels.

## Test environment

Local browser checks used Chromium 153 from the npm `@sparticuz/chromium` package and temporary launch configuration outside the repository. Standard Playwright configuration remains unchanged for CI. The keyboard drag test now waits for the sensor's deferred listener before sending movement/cancellation keys; the My Tasks unit test allows the shared table's lazy chunk to resolve before asserting its task link.

Chart.js is emitted as an on-demand insights chunk (approximately 158 kB minified / 55 kB gzip). The main bundle's existing Vite advisory warning remains; this change does not claim Lighthouse scores or add chart code to project-only views. Release still requires GitHub checks and verification of the merged GitHub Pages deployment.
