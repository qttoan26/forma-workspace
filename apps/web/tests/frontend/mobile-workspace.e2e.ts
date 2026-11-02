import { expect, test } from '@playwright/test'

test.use({ isMobile: true, hasTouch: true })

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'mobile-user' }),
    }),
  )
})

for (const width of [320, 393, 440]) {
  test(`keeps charts and touch navigation within a ${width}px phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 852 })
    await page.goto('/modules/work/overview')
    const dock = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(dock).toBeVisible()
    await expect(
      dock.getByRole('link', { name: 'Work', exact: true }),
    ).toHaveAttribute('aria-current', 'page')
    await expect(
      page.getByRole('img', { name: 'Task status distribution' }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    for (const control of await dock.locator('a, button').all()) {
      const bounds = (await control.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
    }
    await dock.getByRole('link', { name: 'Inbox', exact: true }).click()
    await expect(page).toHaveURL(/\/modules\/work\/inbox/)
    await expect(
      page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'Inbox', exact: true }),
    ).toHaveAttribute('aria-current', 'page')
  })
}

test('opens all modules from the dock and returns focus after dismissal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/modules/work/overview')
  const browse = page.getByRole('button', { name: 'Browse modules' })
  await browse.click()
  const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
  await expect(
    sidebar.getByRole('button', { name: 'Close navigation' }),
  ).toBeFocused()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await page.keyboard.press('Shift+Tab')
  await expect(
    sidebar.getByRole('link', { name: 'Forma Workspace home' }),
  ).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(
    sidebar.getByRole('button', { name: 'Expand Admin sections' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(browse).toBeFocused()
  await expect(browse).toHaveAttribute('aria-expanded', 'false')
})

test('retains phone navigation after landscape rotation and restores desktop at larger widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 852, height: 393 })
  await page.goto('/modules/work/overview')
  const dock = page.getByRole('navigation', { name: 'Mobile navigation' })
  await expect(dock).toBeVisible()
  await page.getByRole('button', { name: 'Browse modules' }).click()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(dock).toBeHidden()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await expect(
    page
      .getByRole('button', { name: 'Collapse navigation', exact: true })
      .or(page.getByRole('button', { name: 'Expand navigation', exact: true })),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    1280,
  )
})

test('contains the mobile table and keeps task editing usable in a short viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/workspaces/forma/projects/project-1?view=table')
  const region = page.getByRole('region', { name: 'Scrollable task table' })
  await expect(region).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    393,
  )
  expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  )
  await region.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
  })
  expect(await region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  await region.evaluate((el) => {
    el.scrollLeft = 0
  })
  await page
    .getByRole('button', { name: 'Open Upgrade the Mark LXXXV armor' })
    .click()
  const drawer = page.getByRole('dialog', { name: 'Edit task' })
  await expect(drawer).toBeVisible()
  await page.setViewportSize({ width: 393, height: 500 })
  await drawer.getByLabel('Title', { exact: true }).fill('Mobile task update')
  expect(
    await drawer
      .getByLabel('Title', { exact: true })
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe('16px')
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await expect(drawer).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Open Mobile task update' }),
  ).toBeVisible()
})
