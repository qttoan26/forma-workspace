import { expect, test, type Page } from '@playwright/test'

const productionKey = 'forma-workspace:production-jobs:v1:project-1'
test.beforeEach(async ({ context }) => {
  await context.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
})
async function fillPackage(page: Page, name: string) {
  await page.getByLabel('Package name', { exact: true }).fill(name)
  await page
    .getByRole('checkbox', {
      name: 'FOR-18 Upgrade the Mark LXXXV armor',
      exact: true,
    })
    .check()
  await page
    .getByRole('combobox', { name: 'Owner', exact: true })
    .selectOption('member-2')
}
async function createDocument(page: Page) {
  await page.goto('/modules/documents/intake')
  await page
    .getByLabel('Document name', { exact: true })
    .fill('Source brief.pdf')
  await page
    .getByLabel('Reference location', { exact: true })
    .fill('DOC-PRODUCTION-1')
  await page
    .getByRole('button', { name: 'Register reference', exact: true })
    .click()
  await expect(page.getByText('Reference registered locally.')).toBeVisible()
}

test('creates, edits, queues, filters and removes packages without deleting Work or Document sources', async ({
  page,
}) => {
  await createDocument(page)
  await page.goto('/modules/production/intake')
  await fillPackage(page, 'Armor source preparation')
  await page
    .getByRole('combobox', { name: 'Work type', exact: true })
    .selectOption('scan')
  await page
    .getByRole('checkbox', { name: 'Source brief.pdf', exact: true })
    .check()
  await page
    .getByRole('button', { name: 'Save draft package', exact: true })
    .click()
  await expect(
    page.getByText(/^Draft work package saved locally/),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Queue', exact: true }).click()
  const table = page.getByRole('table', { name: 'Work packages' })
  await table
    .getByRole('button', { name: 'Armor source preparation', exact: true })
    .click()
  const editor = page.getByRole('dialog', { name: 'Work package editor' })
  await expect(
    editor.getByRole('button', { name: 'Close package editor' }),
  ).toBeFocused()
  await editor
    .getByRole('combobox', { name: 'Priority', exact: true })
    .selectOption('urgent')
  await editor.getByLabel('Due date', { exact: true }).fill('2026-11-15')
  await expect(
    editor.getByRole('button', { name: 'Queue package', exact: true }),
  ).toBeDisabled()
  await editor
    .getByRole('button', { name: 'Save package', exact: true })
    .click()
  await expect(page.getByText('Work package updated locally.')).toBeVisible()
  await table
    .getByRole('button', { name: 'Armor source preparation', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Queue package', exact: true })
    .click()
  await expect(page.getByText('Work package queued locally.')).toBeVisible()
  await page.reload()
  await page
    .getByRole('combobox', { name: 'Package status', exact: true })
    .selectOption('queued')
  await page
    .getByRole('combobox', { name: 'Owner filter', exact: true })
    .selectOption('member-2')
  await page
    .getByRole('combobox', { name: 'Work type filter', exact: true })
    .selectOption('scan')
  await page
    .getByRole('searchbox', { name: 'Search packages', exact: true })
    .fill('FOR-18')
  await expect(table.getByText('Queued', { exact: true })).toBeVisible()
  await expect(table.getByText('urgent', { exact: true })).toBeVisible()
  await expect(table.getByText('2026-11-15')).toBeVisible()
  await table.getByRole('link', { name: 'FOR-18', exact: true }).click()
  await expect(
    page
      .getByRole('dialog', { name: 'Edit task', exact: true })
      .getByLabel('Title', { exact: true }),
  ).toHaveValue('Upgrade the Mark LXXXV armor')
  await page.goto('/modules/production/queue')
  await table
    .getByRole('button', { name: 'Armor source preparation', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Return to draft', exact: true })
    .click()
  await expect(page.getByText('Work package returned to draft.')).toBeVisible()
  await table
    .getByRole('button', { name: 'Armor source preparation', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Remove package', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Confirm remove package', exact: true })
    .click()
  await expect(table.getByText('No matching work packages')).toBeVisible()
  await page.goto('/modules/documents/library')
  await expect(
    page.getByRole('button', { name: 'Source brief.pdf', exact: true }),
  ).toBeVisible()
  await page.goto('/modules/work/tasks')
  await expect(
    page.getByRole('link', {
      name: 'Upgrade the Mark LXXXV armor',
      exact: true,
    }),
  ).toBeVisible()
})

test('preserves concurrent intake and rejects stale package edits across tabs', async ({
  page,
  context,
}) => {
  const other = await context.newPage()
  await page.goto('/modules/production/intake')
  await other.goto('/modules/production/intake')
  await fillPackage(page, 'First work package')
  await fillPackage(other, 'Second work package')
  await Promise.all([
    page.getByRole('button', { name: 'Save draft package' }).click(),
    other.getByRole('button', { name: 'Save draft package' }).click(),
  ])
  for (const current of [page, other]) {
    await expect(
      current.getByRole('button', { name: 'First work package', exact: true }),
    ).toBeVisible()
    await expect(
      current.getByRole('button', { name: 'Second work package', exact: true }),
    ).toBeVisible()
    await current
      .getByRole('button', { name: 'First work package', exact: true })
      .click()
  }
  // Intake and the editor both have a package-name field; scope to the modal.
  const firstEditor = page.getByRole('dialog', { name: 'Work package editor' })
  const staleEditor = other.getByRole('dialog', { name: 'Work package editor' })
  await firstEditor
    .getByLabel('Package name', { exact: true })
    .fill('Updated first package')
  await firstEditor
    .getByRole('button', { name: 'Save package', exact: true })
    .click()
  await expect(page.getByText('Work package updated locally.')).toBeVisible()
  await staleEditor
    .getByLabel('Package name', { exact: true })
    .fill('Stale first package')
  await staleEditor
    .getByRole('button', { name: 'Save package', exact: true })
    .click()
  await expect(staleEditor.getByRole('alert')).toContainText(
    'changed in another view',
  )
  await expect(
    staleEditor.getByLabel('Package name', { exact: true }),
  ).toHaveValue('Stale first package')
  await staleEditor
    .getByRole('button', { name: 'Close package editor' })
    .click()
  await expect(
    other.getByRole('button', { name: 'Updated first package', exact: true }),
  ).toBeVisible()
})

test('requires repairing a removed document reference before queueing', async ({
  page,
  context,
}) => {
  await createDocument(page)
  await page.goto('/modules/production/intake')
  await fillPackage(page, 'Document review package')
  await page
    .getByRole('checkbox', { name: 'Source brief.pdf', exact: true })
    .check()
  await page
    .getByRole('button', { name: 'Save draft package', exact: true })
    .click()
  await expect(
    page.getByText(/^Draft work package saved locally/),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Queue', exact: true }).click()
  const other = await context.newPage()
  await other.goto('/modules/documents/library')
  await other
    .getByRole('button', { name: 'Source brief.pdf', exact: true })
    .click()
  await other
    .getByRole('button', { name: 'Remove reference', exact: true })
    .click()
  await other
    .getByRole('button', { name: 'Confirm remove', exact: true })
    .click()
  await expect(page.getByText('Needs attention · 1 unavailable')).toBeVisible()
  await page
    .getByRole('button', { name: 'Document review package', exact: true })
    .click()
  const editor = page.getByRole('dialog', { name: 'Work package editor' })
  await expect(
    editor.getByRole('button', { name: 'Queue package', exact: true }),
  ).toBeDisabled()
  await editor
    .getByRole('checkbox', { name: /Document .*unavailable/ })
    .uncheck()
  await editor
    .getByRole('button', { name: 'Save package', exact: true })
    .click()
  await expect(page.getByText('Needs attention · 1 unavailable')).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Document review package', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Queue package', exact: true })
    .click()
  await expect(page.getByText('Work package queued locally.')).toBeVisible()
})

test('protects unreadable stored packages', async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{invalid'),
    productionKey,
  )
  await page.goto('/modules/production/intake')
  await expect(page.getByRole('alert')).toContainText(
    'Saved work packages could not be loaded',
  )
  await expect(
    page.getByRole('button', { name: 'Save draft package', exact: true }),
  ).toHaveCount(0)
  expect(
    await page.evaluate((key) => localStorage.getItem(key), productionKey),
  ).toBe('{invalid')
})

test.describe('Phone production queue', () => {
  test.use({ isMobile: true, hasTouch: true })
  test('contains scrolling, pagination and keyboard editing at 375px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.addInitScript(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify(
            Array.from({ length: 40 }, (_, index) => ({
              id: `phone-job-${index}`,
              projectId: 'project-1',
              name: `Phone package ${String(index).padStart(2, '0')}`,
              workType: 'general',
              requirements: '',
              taskIds: ['FOR-18'],
              documentReferenceIds: [],
              priority: 'medium',
              status: 'draft',
              revision: 0,
              createdAt: '2026-11-02T00:00:00.000Z',
              updatedAt: '2026-11-02T00:00:00.000Z',
            })),
          ),
        ),
      productionKey,
    )
    await page.goto('/modules/production/queue')
    await expect(
      page.getByRole('button', { name: 'Phone package 00', exact: true }),
    ).toBeVisible()
    const scroll = page.getByRole('region', { name: 'Production queue table' })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375)
    expect(
      await scroll.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true)
    expect(
      await scroll.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(true)
    await page
      .getByRole('button', { name: 'Phone package 00', exact: true })
      .click()
    const editor = page.getByRole('dialog', { name: 'Work package editor' })
    await expect(editor.getByLabel('Package name', { exact: true })).toHaveCSS(
      'font-size',
      '16px',
    )
    await editor.getByLabel('Package name', { exact: true }).press('Escape')
    await expect(editor).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Phone package 00', exact: true }),
    ).toBeFocused()
    await page
      .getByRole('combobox', { name: 'Rows per page', exact: true })
      .selectOption('25')
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText('26–40 of 40 packages')).toBeVisible()
  })
})
