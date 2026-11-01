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
  await expect(drawer).toBeHidden()
  await expect(
    page.getByRole('button', {
      name: 'Edit Sidebar and board share this saved task',
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Work sections' })
    .getByRole('link', { name: 'Tasks', exact: true })
    .click()
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

test('finds a sidebar section and opens its correct detail with Enter', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Search workspace navigation' })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Find your workspace tools' })
  const input = dialog.getByRole('searchbox', {
    name: 'Find a module or section',
  })
  await expect(input).toBeFocused()
  await input.fill('OCR')
  await expect(
    dialog.getByRole('link', { name: /OCR & extraction/ }),
  ).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/\/modules\/documents\/ocr$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'OCR & extraction' }),
  ).toBeVisible()
})

test('supports quick-search shortcuts, empty results and focus restoration', async ({
  page,
}) => {
  await page.goto('/modules/work/tasks')
  const trigger = page.getByRole('button', {
    name: 'Search workspace navigation',
  })
  await trigger.focus()
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Find your workspace tools' })
  const input = dialog.getByRole('searchbox', {
    name: 'Find a module or section',
  })
  await input.fill('missing-destination')
  await expect(dialog.getByRole('status')).toHaveText(
    'No destinations found for “missing-destination”.',
  )
  await expect(dialog.getByRole('link')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(input).toHaveValue('')
  await input.fill('Projects')
  await input.press('ArrowDown')
  const firstResult = dialog.getByRole('link').first()
  await expect(firstResult).toBeFocused()
  await firstResult.press('ArrowUp')
  await expect(input).toBeFocused()
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('opens quick navigation on mobile and respects the Pages-compatible section path', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Search workspace navigation' })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Find your workspace tools' })
  await dialog
    .getByRole('searchbox', { name: 'Find a module or section' })
    .fill('admin permissions')
  await expect(
    dialog.getByRole('link', { name: /Roles & permissions/ }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await dialog.getByRole('link', { name: /Roles & permissions/ }).click()
  await expect(page).toHaveURL(/\/modules\/admin\/access$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Roles & permissions' }),
  ).toBeVisible()
})

test('does not open navigation search over an active task editor', async ({
  page,
}) => {
  await page.goto('/workspaces/forma/projects/project-1?task=FOR-18')
  const editor = page.getByRole('dialog', { name: 'Edit task' })
  await expect(editor).toBeVisible()
  await page.keyboard.press('Control+k')
  await expect(
    page.getByRole('dialog', { name: 'Find your workspace tools' }),
  ).toBeHidden()
  await expect(editor).toBeVisible()
})
