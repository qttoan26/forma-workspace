import { expect, test } from '@playwright/test'
import { expectSavedTaskStatus } from './expect-saved-task-status'

const projectPath = '/workspaces/forma/projects/project-1'
const taskTitle = 'Upgrade the Mark LXXXV armor'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'smoke-user' }),
    }),
  )
})

test('sorts the TanStack table and opens the corresponding task drawer', async ({
  page,
}) => {
  await page.goto(`${projectPath}?view=table`)
  const table = page.getByRole('table', { name: 'Tasks', exact: true })
  const header = table
    .getByRole('columnheader', { name: 'Task', exact: false })
    .filter({ has: page.getByRole('button', { name: /^Task/ }) })
  await header.getByRole('button').click()
  await expect(header).toHaveAttribute('aria-sort', 'ascending')
  await expect(table.getByRole('row').nth(1)).toContainText(
    'Analyze gamma radiation signatures',
  )
  await header.getByRole('button').click()
  await expect(header).toHaveAttribute('aria-sort', 'descending')
  await expect(table.getByRole('row').nth(1)).toContainText(
    'Upgrade the Mark LXXXV armor',
  )
  await table.getByRole('button', { name: `Open ${taskTitle}` }).click()
  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(taskTitle)
})

test('moves a task with the mouse and retains it after reload', async ({
  page,
}) => {
  await page.goto(projectPath)
  const handle = page.getByRole('button', { name: `Drag ${taskTitle}` })
  const target = page.locator('.board-column[data-status="in-progress"]')
  await handle.scrollIntoViewIfNeeded()
  const sourceBox = (await handle.boundingBox())!
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 12,
    sourceBox.y + sourceBox.height / 2,
    { steps: 4 },
  )
  await expect(page.locator('.task-drag-preview')).toBeVisible()
  const targetBox = (await target.boundingBox())!
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 80, {
    steps: 12,
  })
  await expect(target).toHaveClass(/is-drag-over/)
  await page.mouse.up()
  await expect(target.getByRole('heading', { name: taskTitle })).toBeVisible()
  await expect(
    page
      .locator('.board-column[data-status="todo"]')
      .getByRole('heading', { name: taskTitle }),
  ).toHaveCount(0)
  await expectSavedTaskStatus(page, 'FOR-18', 'in-progress')
  await page.reload()
  await expect(target.getByRole('heading', { name: taskTitle })).toBeVisible()
})

test('supports keyboard drop into an empty column and Escape cancellation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([
        {
          id: 'FOR-12',
          projectId: 'project-1',
          title: 'Map Bifrost evacuation routes',
          status: 'backlog',
          priority: 'medium',
          assigneeId: 'member-3',
        },
        {
          id: 'FOR-18',
          projectId: 'project-1',
          title: 'Upgrade the Mark LXXXV armor',
          status: 'todo',
          priority: 'high',
          assigneeId: 'member-2',
        },
        {
          id: 'FOR-21',
          projectId: 'project-1',
          title: 'Deploy the Ultron defense firewall',
          status: 'in-progress',
          priority: 'urgent',
          assigneeId: 'member-2',
        },
        {
          id: 'FOR-07',
          projectId: 'project-1',
          title: 'Approve the Avengers response protocol',
          status: 'done',
          priority: 'low',
          assigneeId: 'member-1',
        },
      ]),
    )
  })
  await page.goto(projectPath)
  await page
    .getByRole('combobox', {
      name: 'Move Map Bifrost evacuation routes',
      exact: true,
    })
    .selectOption('done')
  const handle = page.getByRole('button', { name: `Drag ${taskTitle}` })
  await handle.focus()
  await page.keyboard.press('Space')
  await expect(handle).toHaveAttribute('aria-pressed', 'true')
  // KeyboardSensor attaches its document listener after the pickup event.
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  )
  await page.keyboard.press('ArrowLeft')
  await expect(
    page.locator('.board-column[data-status="backlog"]'),
  ).toHaveClass(/is-drag-over/)
  await page.keyboard.press('Space')
  await expect(
    page
      .locator('.board-column[data-status="backlog"]')
      .getByRole('heading', { name: taskTitle }),
  ).toBeVisible()
  await expect(handle).toBeFocused()
  await handle.focus()
  await page.keyboard.press('Space')
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  )
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.board-column[data-status="todo"]')).toHaveClass(
    /is-drag-over/,
  )
  await page.keyboard.press('Escape')
  await expect(
    page
      .locator('.board-column[data-status="backlog"]')
      .getByRole('heading', { name: taskTitle }),
  ).toBeVisible()
  await expect(page.locator('.task-drag-preview')).toHaveCount(0)
})

test('dropping outside the board leaves the task unchanged', async ({
  page,
}) => {
  await page.goto(projectPath)
  const handle = page.getByRole('button', { name: `Drag ${taskTitle}` })
  await handle.scrollIntoViewIfNeeded()
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, {
    steps: 4,
  })
  await expect(page.locator('.task-drag-preview')).toBeVisible()
  await page.mouse.move(700, 20, { steps: 12 })
  await expect(page.locator('.board-column.is-drag-over')).toHaveCount(0)
  await page.mouse.up()
  await expect(
    page
      .locator('.board-column[data-status="todo"]')
      .getByRole('heading', { name: taskTitle }),
  ).toBeVisible()
})

test('keeps the mobile table inside its own scroll region with reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${projectPath}?view=table`)
  await expect(
    page.getByRole('table', { name: 'Tasks', exact: true }),
  ).toBeVisible()
  const sizes = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    table: document.querySelector('.task-table-scroll')?.scrollWidth,
  }))
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport)
  expect(sizes.table).toBeGreaterThan(sizes.viewport)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(
    page.getByRole('navigation', { name: 'Workspace modules' }),
  ).toBeVisible()
})
