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
  const dayBounds = (await today.boundingBox())!
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
  await expect(calendar.getByText('No deadlines this week.')).toBeVisible()
  await calendar.getByRole('button', { name: 'Go to a scheduled week' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: '7 deadlines this week' }),
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
