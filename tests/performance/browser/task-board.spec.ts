import { expect, test } from '@playwright/test'

type BenchmarkSnapshot = {
  ready: boolean
  count: number
  mountActualDurationMs?: number
  mountBaseDurationMs?: number
  mountCommitTimeMs?: number
  lastUpdateActualDurationMs?: number
  lastUpdateCommitTimeMs?: number
  updateCount: number
  domNodes?: number
  taskCards?: number
  usedJsHeapSize?: number
  longTasks: number[]
}

type BenchmarkWindow = Window & {
  __FORMA_BENCHMARK__?: BenchmarkSnapshot
}

const taskCounts = parseTaskCounts(
  process.env.FORMA_BROWSER_TASK_COUNTS ?? '1000,10000',
)

for (const count of taskCounts) {
  test(`${count.toLocaleString()} task browser baseline`, async ({ page }) => {
    await page.goto(`/?count=${count}`)
    await page.waitForFunction(
      () => (window as BenchmarkWindow).__FORMA_BENCHMARK__?.ready === true,
    )

    const initial = await page.evaluate(
      () => (window as BenchmarkWindow).__FORMA_BENCHMARK__,
    )

    expect(initial?.taskCards).toBe(count)
    expect(initial?.domNodes).toBeGreaterThan(count)

    const filter = await page.evaluate(async () => {
      const benchmark = (window as BenchmarkWindow).__FORMA_BENCHMARK__
      const button = document.querySelector<HTMLButtonElement>(
        '[data-testid="benchmark-filter"]',
      )

      if (!benchmark || !button) {
        throw new Error('Benchmark filter controls are unavailable')
      }

      const previousUpdateCount = benchmark.updateCount
      const startedAt = performance.now()
      button.click()

      const timeoutAt = performance.now() + 30_000
      while (benchmark.updateCount <= previousUpdateCount) {
        if (performance.now() > timeoutAt) {
          throw new Error('Timed out waiting for benchmark commit')
        }

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        )
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )

      return {
        wallDurationMs: performance.now() - startedAt,
        reactActualDurationMs: benchmark.lastUpdateActualDurationMs,
        commitTimeMs: benchmark.lastUpdateCommitTimeMs,
        visibleTaskCards: document.querySelectorAll('.task-card').length,
      }
    })

    const move = await page.evaluate(async () => {
      const benchmark = (window as BenchmarkWindow).__FORMA_BENCHMARK__
      const select = document.querySelector<HTMLSelectElement>(
        '.task-card select[aria-label^="Move "]',
      )

      if (!benchmark || !select) {
        throw new Error('Benchmark move control is unavailable')
      }

      const previousUpdateCount = benchmark.updateCount
      const startedAt = performance.now()
      select.value = 'done'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      const timeoutAt = performance.now() + 30_000
      while (benchmark.updateCount <= previousUpdateCount) {
        if (performance.now() > timeoutAt) {
          throw new Error('Timed out waiting for benchmark commit')
        }

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        )
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )

      return {
        wallDurationMs: performance.now() - startedAt,
        reactActualDurationMs: benchmark.lastUpdateActualDurationMs,
        commitTimeMs: benchmark.lastUpdateCommitTimeMs,
      }
    })

    const finalSnapshot = await page.evaluate(
      () => (window as BenchmarkWindow).__FORMA_BENCHMARK__,
    )

    console.log(
      `FORMA_BROWSER_PERF ${JSON.stringify({
        count,
        initial,
        filter,
        move,
        finalSnapshot,
      })}`,
    )
  })
}

function parseTaskCounts(value: string) {
  const counts = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(
      (count) => Number.isInteger(count) && count > 0 && count <= 100_000,
    )

  return counts.length > 0 ? counts : [1_000]
}
