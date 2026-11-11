import { expect, test } from '@playwright/test'
import type { Task } from '../../src/entities/task/model/task'
import { expectSavedTaskStatus } from './expect-saved-task-status'

const tasks: Task[] = Array.from({ length: 70 }, (_, index) => ({
  id: `FOR-${100 + index}`,
  projectId: 'project-1',
  title: `Analytics task ${String(index + 1).padStart(2, '0')}`,
  status: index < 10 ? 'done' : 'todo',
  priority: 'high',
  assigneeId: index % 2 ? 'member-2' : 'member-1',
  dueDate: '2026-11-10',
}))

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
  await page.addInitScript((snapshot) => {
    localStorage.setItem('forma:tasks:v1:project-1', JSON.stringify(snapshot))
  }, tasks)
})

test('renders real Chart.js charts and updates overview after a saved task move', async ({
  page,
}) => {
  await page.goto('/modules/work/overview')
  await expect(page.getByText('10 of 70 tasks completed (14%).')).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Task status distribution' }),
  ).toBeVisible()
  const canvases = page.locator('canvas')
  const chartsHavePaint = () =>
    canvases.evaluateAll((items) =>
      items.map((canvas) => {
        if (!(canvas instanceof HTMLCanvasElement)) return false
        const context = canvas.getContext('2d')!
        return context
          .getImageData(0, 0, canvas.width, canvas.height)
          .data.some((value, index) => index % 4 === 3 && value > 0)
      }),
    )
  await expect.poll(chartsHavePaint).toEqual([true, true])
  const chartImages = () =>
    canvases.evaluateAll((items) =>
      items.map((item) => (item as HTMLCanvasElement).toDataURL()),
    )
  const initialCharts = await chartImages()
  await page
    .getByRole('group', { name: 'Task status chart type' })
    .getByRole('button', { name: 'Pie' })
    .click()
  await page
    .getByRole('group', { name: 'Owner workload chart type' })
    .getByRole('button', { name: 'Grouped bars' })
    .click()
  await expect.poll(chartsHavePaint).toEqual([true, true])
  const updatedCharts = await chartImages()
  expect(updatedCharts[0]).not.toBe(initialCharts[0])
  expect(updatedCharts[1]).not.toBe(initialCharts[1])
  await expect(page.getByText('10 of 70 tasks completed (14%).')).toBeVisible()
  await page.goto('/workspaces/forma/projects/project-1')
  await page
    .getByRole('combobox', { name: 'Move Analytics task 11', exact: true })
    .selectOption('done')
  await expectSavedTaskStatus(page, 'FOR-110', 'done')
  await page.goto('/modules/work/overview')
  await expect(page.getByText('11 of 70 tasks completed (16%).')).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('11 of 70 tasks completed (16%).')).toBeVisible()
})

test('contains table scrolling and keeps the header and pagination visible', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1?view=table')
  const region = page.getByRole('region', { name: 'Scrollable task table' })
  await expect(
    page.getByRole('table', { name: 'Tasks', exact: true }),
  ).toBeVisible()
  expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  )
  await region.scrollIntoViewIfNeeded()
  const pageY = await page.evaluate(() => scrollY)
  await region.hover()
  await page.mouse.wheel(0, 450)
  await expect
    .poll(() => region.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0)
  expect(await page.evaluate(() => scrollY)).toBe(pageY)
  const header = page.getByRole('columnheader', { name: /^ID/ })
  const headerBox = (await header.boundingBox())!
  const regionBox = (await region.boundingBox())!
  expect(Math.abs(headerBox.y - regionBox.y)).toBeLessThan(2)
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Page 2 of 3')).toBeVisible()
})

test('contains list and board column scrolling, with mobile chart responsiveness', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1?view=list')
  const list = page.getByRole('region', { name: 'Project task list content' })
  await expect(list).toBeVisible()
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  )
  await list.focus()
  await page.keyboard.press('End')
  await expect
    .poll(() => list.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0)
  await page.goto('/workspaces/forma/projects/project-1')
  const column = page.getByRole('list', { name: 'Todo tasks', exact: true })
  expect(await column.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  )
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/modules/work/overview')
  await expect(
    page.getByRole('img', { name: 'Task status distribution' }),
  ).toBeVisible()
  await page
    .getByRole('group', { name: 'Task status chart type' })
    .getByRole('button', { name: 'Horizontal bars' })
    .click()
  await page
    .getByRole('group', { name: 'Owner workload chart type' })
    .getByRole('button', { name: 'Grouped bars' })
    .focus()
  await page.keyboard.press('Enter')
  await expect(
    page
      .getByRole('group', { name: 'Owner workload chart type' })
      .getByRole('button', { name: 'Grouped bars', pressed: true }),
  ).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    375,
  )
  const dimensions = await page.locator('canvas').evaluateAll((items) =>
    items.map((item) => ({
      width: item.getBoundingClientRect().width,
      height: item.getBoundingClientRect().height,
    })),
  )
  expect(
    dimensions.every(
      (item) => item.width > 0 && item.width <= 375 && item.height > 0,
    ),
  ).toBe(true)
})
