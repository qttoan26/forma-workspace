import { expect, test } from '@playwright/test'
import type { Task } from '../../src/entities/task/model/task'

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
  await expect
    .poll(() =>
      page.locator('canvas').evaluateAll((canvases) =>
        canvases.map((canvas) => {
          if (!(canvas instanceof HTMLCanvasElement)) return false
          const context = canvas.getContext('2d')!
          return context
            .getImageData(0, 0, canvas.width, canvas.height)
            .data.some((value, index) => index % 4 === 3 && value > 0)
        }),
      ),
    )
    .toEqual([true, true])
  await page.goto('/workspaces/forma/projects/project-1')
  await page
    .getByRole('combobox', { name: 'Move Analytics task 11', exact: true })
    .selectOption('done')
  // A hard navigation can interrupt an in-flight browser write. Assert the
  // committed snapshot before testing that the next page reads that snapshot.
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('forma-workspace', 3)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () =>
            reject(request.error ?? new Error('open failed'))
        })
        try {
          return await new Promise<string | undefined>((resolve, reject) => {
            const request = database
              .transaction('project-tasks', 'readonly')
              .objectStore('project-tasks')
              .get('project-1') as IDBRequest<{ tasks: Task[] } | undefined>
            request.onsuccess = () =>
              resolve(
                request.result?.tasks.find((task) => task.id === 'FOR-110')
                  ?.status,
              )
            request.onerror = () =>
              reject(request.error ?? new Error('read failed'))
          })
        } finally {
          database.close()
        }
      }),
    )
    .toBe('done')
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
