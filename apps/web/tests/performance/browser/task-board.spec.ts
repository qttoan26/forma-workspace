import { expect, test } from '@playwright/test'

type BenchmarkSnapshot = {
  ready: boolean
  count: number
  mountWallDurationMs?: number
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

    expect(initial?.taskCards).toBeGreaterThan(0)
    expect(initial?.taskCards).toBeLessThan(count)
    expect(initial?.domNodes).toBeGreaterThan(initial?.taskCards ?? 0)

    const filter = await page.evaluate(async () => {
      const benchmark = (window as BenchmarkWindow).__FORMA_BENCHMARK__
      const button = document.querySelector<HTMLButtonElement>(
        '[data-testid="benchmark-filter"]',
      )
      const status = document.querySelector<HTMLElement>('[role="status"]')

      if (!benchmark || !button || !status) {
        throw new Error('Benchmark filter controls are unavailable')
      }

      const statusBefore = status.textContent
      const startedAt = performance.now()
      button.click()

      const timeoutAt = performance.now() + 30_000
      while (status.textContent === statusBefore) {
        if (performance.now() > timeoutAt) {
          throw new Error('Timed out waiting for filter DOM commit')
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
        visibleTaskCards: document.querySelectorAll('.task-card').length,
        resultStatus: status.textContent,
      }
    })

    expect(filter.visibleTaskCards).toBeGreaterThan(0)
    expect(filter.visibleTaskCards).toBeLessThan(count)
    expect(filter.resultStatus).not.toBe(`${count} of ${count} tasks shown`)

    const move = await page.evaluate(async () => {
      const select = document.querySelector<HTMLSelectElement>(
        '.task-card select[aria-label^="Move "]',
      )
      const doneColumn = document.querySelector<HTMLElement>(
        '.board-column[aria-labelledby="column-done"]',
      )
      const doneCount = doneColumn?.querySelector<HTMLElement>(
        '.column-header span',
      )

      if (!select || !doneCount) {
        throw new Error('Benchmark move controls are unavailable')
      }

      const doneCountBefore = doneCount.textContent
      const startedAt = performance.now()
      select.value = 'done'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      const timeoutAt = performance.now() + 30_000
      while (doneCount.textContent === doneCountBefore) {
        if (performance.now() > timeoutAt) {
          throw new Error('Timed out waiting for move DOM commit')
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
        doneCountBefore,
        doneCountAfter: doneCount.textContent,
      }
    })

    expect(move.doneCountAfter).not.toBe(move.doneCountBefore)

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
    .filter((count) => Number.isInteger(count) && count > 0 && count <= 100_000)

  return counts.length > 0 ? counts : [1_000]
}
