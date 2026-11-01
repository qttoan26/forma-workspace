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

test('persists task comments in the shared drawer activity tab', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1?view=list')

  await page
    .getByRole('button', { name: 'Open Create board interaction model' })
    .click()

  const drawer = page.getByRole('dialog', { name: 'Edit task' })
  await drawer.getByRole('tab', { name: 'Activity' }).click()
  await expect(drawer.getByText('No activity yet')).toBeVisible()

  await drawer.getByLabel('Add comment').fill('Ready for customer review')
  await drawer.getByRole('button', { name: 'Comment' }).click()

  await expect(drawer.getByText('Ready for customer review')).toBeVisible()
  await expect(drawer.getByRole('status')).toHaveText('Comment saved locally.')

  await drawer.getByRole('button', { name: 'Cancel' }).click()
  await expect(drawer).toBeHidden()

  await page
    .getByRole('button', { name: 'Open Create board interaction model' })
    .click()
  await drawer.getByRole('tab', { name: 'Activity' }).click()

  await expect(drawer.getByText('Ready for customer review')).toBeVisible()
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

test('sidebar opens the selected detail and reflects edits from the project board', async ({
  page,
}) => {
  await page.goto('/modules/work/tasks')
  await page.getByRole('button', { name: 'Open Work menu' }).click()
  const workMenu = page.getByRole('navigation', { name: 'Work sections' })
  await expect(
    workMenu.getByRole('link', { name: 'Tasks', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await page
    .getByRole('link', { name: 'Create board interaction model', exact: true })
    .click()
  const drawer = page.getByRole('dialog', { name: 'Edit task' })
  await drawer
    .getByLabel('Title')
    .fill('Sidebar and board share this saved task')
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await page.goto('/modules/work/tasks')
  await expect(
    page.getByRole('link', {
      name: 'Sidebar and board share this saved task',
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Expand Documents & Data sections' })
    .click()
  await page
    .getByRole('navigation', { name: 'Documents & Data sections' })
    .getByRole('link', { name: /OCR & extraction/ })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'OCR & extraction' }),
  ).toBeVisible()
  await expect(page.getByText('Extraction jobs', { exact: true })).toBeVisible()
})

test('mobile sidebar contains focus, closes with Escape and opens the correct section', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/modules/work/tasks')
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click()
  await expect(page.locator('.workspace-sidebar-close')).toBeFocused()
  await expect(page.locator('.workspace-shell-main')).toHaveAttribute(
    'inert',
    '',
  )
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Open navigation', exact: true }),
  ).toBeFocused()
  await expect(page.locator('.workspace-sidebar')).toHaveAttribute('inert', '')
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click()
  await page.getByRole('button', { name: 'Expand Production sections' }).click()
  await page
    .getByRole('navigation', { name: 'Production sections' })
    .getByRole('link', { name: /Quality control/ })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Quality control' }),
  ).toBeVisible()
  await expect(
    page.getByText('Review checklist', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.workspace-sidebar')).toHaveAttribute('inert', '')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
