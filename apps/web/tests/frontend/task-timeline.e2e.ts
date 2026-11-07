import { expect, test } from '@playwright/test'

test.use({ timezoneId: 'Asia/Ho_Chi_Minh' })

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-06T17:30:00Z'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { id: 'smoke-user' } }),
  )
})

test('shows the correct deadline column and opens a past task in its project week', async ({
  page,
}) => {
  await page.goto('/modules/work/timeline')

  const calendar = page.getByRole('region', { name: 'Task timeline calendar' })
  const today = calendar.locator('time[aria-current="date"]')
  await expect(today).toHaveAttribute('datetime', '2026-11-07')
  await expect(
    calendar.getByRole('list', { name: 'Scheduled tasks' }),
  ).toContainText('Analyze gamma radiation signatures')
  const marker = calendar
    .getByRole('listitem')
    .filter({ hasText: 'Analyze gamma radiation signatures' })
    .locator('.task-timeline-deadline')
  const deadlineDay = calendar.locator(
    '.task-timeline-axis time[datetime="2026-11-08"]',
  )
  const dayBounds = (await deadlineDay.boundingBox())!
  const markerBounds = (await marker.boundingBox())!
  expect(markerBounds.x + markerBounds.width / 2).toBeCloseTo(
    dayBounds.x + dayBounds.width / 2,
    0,
  )

  await page.getByRole('button', { name: 'Previous week' }).press('Enter')
  await calendar
    .getByRole('link', { name: 'Open Upgrade the Mark LXXXV armor' })
    .click()
  await expect(page).toHaveURL(/project-1\?view=timeline&task=FOR-18/)
  const drawer = page.getByRole('dialog', { name: 'Task details' })
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: 'Close' }).click()
  await expect(
    calendar.getByRole('button', { name: 'Open Upgrade the Mark LXXXV armor' }),
  ).toBeVisible()
  await expect(calendar.locator('time[aria-current="date"]')).toHaveCount(0)
  await expect(
    calendar
      .getByRole('listitem')
      .filter({ hasText: 'Upgrade the Mark LXXXV armor' })
      .getByText('Overdue', { exact: true }),
  ).toBeVisible()
})

test('keeps mobile navigation and unscheduled tasks available in an empty week', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/workspaces/forma/projects/project-1?view=timeline')

  const calendar = page.getByRole('region', { name: 'Task timeline calendar' })
  await page.getByRole('button', { name: 'Next week' }).click()
  await expect(
    calendar.getByText('No scheduled tasks this week.'),
  ).toBeVisible()
  await calendar.getByRole('button', { name: 'Go to a scheduled week' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: '7 scheduled tasks this week' }),
  ).toBeFocused()
  await page.getByRole('button', { name: 'Previous week' }).click()
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await expect(calendar.locator('time[aria-current="date"]')).toHaveAttribute(
    'datetime',
    '2026-11-07',
  )

  await calendar.getByText('Unscheduled (3)', { exact: true }).click()
  const task = calendar.getByRole('button', {
    name: 'Open Map Bifrost evacuation routes',
  })
  await task.click()
  await expect(page.getByRole('dialog', { name: 'Task details' })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('persists task dates and estimate and renders a separate deadline at every scale', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/workspaces/forma/projects/project-1?newTask=1')
  const editor = page.getByRole('dialog', { name: 'Create task' })
  await editor.getByLabel('Title').fill('Plan cross-month handoff')
  await editor.getByLabel('Start date').fill('2026-10-30')
  await editor.getByLabel('Due date').fill('2026-11-06')
  await editor.getByLabel('Deadline', { exact: true }).fill('2026-11-08')
  await editor.getByLabel('Estimate (minutes)').fill('150')
  await editor.getByRole('button', { name: 'Create task' }).click()
  await expect(editor).toBeHidden()
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()

  const calendar = page.getByRole('region', { name: 'Task timeline calendar' })
  const row = calendar
    .getByRole('listitem')
    .filter({ hasText: 'Plan cross-month handoff' })
  const plan = row.locator('.task-timeline-plan')
  const deadline = row.locator('.task-timeline-deadline')
  await expect(row).toHaveAttribute('data-deadline-state', 'due-soon')
  await expect(row.getByText('Due soon', { exact: true })).toBeVisible()
  await expect(plan).toHaveCSS('grid-column', '2 / 7')
  await expect(deadline).toHaveCSS('grid-column-start', '8')

  const scale = page.getByRole('combobox', { name: 'Timeline scale' })
  await scale.selectOption('month')
  const axis = calendar.locator('.task-timeline-axis time')
  await expect(axis).toHaveCount(30)
  await expect(plan).toHaveCSS('grid-column', '2 / 8')
  await expect(deadline).toHaveCSS('grid-column-start', '9')
  expect(
    await calendar.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)

  await scale.selectOption('year')
  await expect(axis).toHaveCount(12)
  await expect(plan).toHaveCSS('grid-column', '11 / 13')
  await expect(deadline).toHaveCSS('grid-column-start', '12')
  await page.getByRole('button', { name: 'Previous year' }).click()
  await expect(row).toHaveCount(0)
  await page.getByRole('button', { name: 'Today' }).click()
  await row
    .getByRole('button', { name: 'Open Plan cross-month handoff' })
    .click()
  const details = page.getByRole('dialog', { name: 'Task details' })
  await expect(details.getByText('150 min', { exact: true })).toBeVisible()
  await expect(details.getByText('2026-10-30', { exact: true })).toBeVisible()
  await expect(details.getByText('2026-11-06', { exact: true })).toBeVisible()
  await expect(details.getByText('2026-11-08', { exact: true })).toBeVisible()
})
