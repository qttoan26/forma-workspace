import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'smoke-user' }),
    })
  })
})

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

test('switches project detail views without leaving the project route', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1')

  await page.getByRole('button', { name: 'List' }).click()
  await expect(page).toHaveURL(/project-1\?view=list/)
  await expect(
    page.getByRole('heading', { name: 'Work grouped by status' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Table' }).click()
  await expect(page).toHaveURL(/project-1\?view=table/)
  await expect(
    page.getByRole('heading', { name: 'Dense project inventory' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Calendar' }).click()
  await expect(page).toHaveURL(/project-1\?view=calendar/)
  await expect(
    page.getByRole('heading', { name: 'Due-date schedule' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Timeline' }).click()
  await expect(page).toHaveURL(/project-1\?view=timeline/)
  await expect(
    page.getByRole('heading', { name: 'Delivery sequence' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Files' }).click()
  await expect(page).toHaveURL(/project-1\?view=files/)
  await expect(
    page.getByRole('heading', { name: 'Project documents' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Board' }).click()
  await expect(page).toHaveURL(/\/workspaces\/forma\/projects\/project-1$/)
})

test('edits one live task through the shared drawer across project views', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1?view=list')

  await page
    .getByRole('button', { name: 'Open Create board interaction model' })
    .click()

  await expect(page).toHaveURL(/view=list&task=FOR-18/)
  const drawer = page.getByRole('dialog', { name: 'Edit task' })
  await expect(drawer).toBeVisible()

  await drawer.getByLabel('Title').fill('Create shared task drawer')
  await drawer.getByRole('button', { name: 'Save changes' }).click()

  await expect(drawer).toBeHidden()
  await expect(page).toHaveURL(/project-1\?view=list$/)
  await expect(
    page.getByRole('button', { name: 'Open Create shared task drawer' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Table' }).click()
  await expect(
    page.getByRole('button', { name: 'Open Create shared task drawer' }),
  ).toBeVisible()
})

test('opens the same task drawer from the board editor action', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1')

  await page
    .getByRole('button', { name: 'Edit Create board interaction model' })
    .click()

  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
  await expect(page).toHaveURL(/task=FOR-18/)
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
