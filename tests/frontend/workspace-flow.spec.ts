import { expect, test } from '@playwright/test'

test('opens the approved workspace dashboard and project board', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Keep the work moving.' }),
  ).toBeVisible()

  const projectLink = page.getByRole('link', { name: /Open project board/i })
  await expect(projectLink).toBeVisible()
  await projectLink.click()

  await expect(page).toHaveURL(/\/workspaces\/forma\/projects\/project-1/)
  await expect(
    page.getByRole('heading', { name: 'Product launch' }),
  ).toBeVisible()
})

test('supports a direct deep link to the project board', async ({ page }) => {
  await page.goto('/workspaces/forma/projects/project-1')

  await expect(
    page.getByRole('heading', { name: 'Product launch' }),
  ).toBeVisible()
})

test('shows the project-specific not-found state', async ({ page }) => {
  await page.goto('/workspaces/forma/projects/missing-project')

  await expect(
    page.getByRole('heading', { name: 'Project not found' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Back to workspace home' }),
  ).toBeVisible()
})

test('keeps the primary flow usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Keep the work moving.' }),
  ).toBeVisible()

  await page.getByRole('link', { name: /Open project board/i }).click()

  await expect(
    page.getByRole('heading', { name: 'Product launch' }),
  ).toBeVisible()
})

test('exposes the skip link for keyboard navigation', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Keep the work moving.' }),
  ).toBeVisible()

  const skipLink = page.getByRole('link', { name: /skip/i })
  await page.keyboard.press('Tab')

  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeVisible()
})
