import { expect, test, type Page } from '@playwright/test'

const storageKey = 'forma-workspace:project-document-references:v1:project-1'
test.beforeEach(async ({ context }) => {
  await context.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
})

async function fillReference(page: Page, name: string, location = 'DOC-100') {
  await page.getByLabel('Document name', { exact: true }).fill(name)
  await page.getByLabel('Reference location', { exact: true }).fill(location)
}

test('registers, searches, edits and removes a shared task document reference', async ({
  page,
}) => {
  await page.goto('/modules/documents/library')
  await expect(
    page.getByRole('form', { name: 'Register document reference' }),
  ).toHaveCount(0)
  await page
    .getByRole('link', { name: '+ Register reference', exact: true })
    .click()
  await expect(page).toHaveURL(/\/modules\/documents\/intake$/)
  await fillReference(
    page,
    'Source brief.pdf',
    'https://example.com/source.pdf',
  )
  await page.getByLabel('Linked task', { exact: true }).selectOption('FOR-18')
  await page
    .getByRole('button', { name: 'Register reference', exact: true })
    .click()
  await expect(page.getByText('Reference registered locally.')).toBeVisible()
  await expect(
    page.getByRole('table', { name: 'Document references' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('searchbox', { name: 'Search references' }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Library', exact: true }).click()
  const table = page.getByRole('table', { name: 'Document references' })
  await expect(
    table.getByRole('button', { name: 'Source brief.pdf', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('searchbox', { name: 'Search references' })
    .fill('FOR-18')
  await page
    .getByRole('combobox', { name: 'Source type', exact: true })
    .selectOption('web')
  await expect(
    table.getByRole('button', { name: 'Source brief.pdf', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Link scope', exact: true })
    .selectOption('project')
  await expect(table.getByText('No matching references')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await table
    .getByRole('button', { name: 'Source brief.pdf', exact: true })
    .click()
  const editor = page.getByRole('dialog', { name: 'Document reference editor' })
  await expect(
    editor.getByRole('button', { name: 'Close document editor' }),
  ).toBeFocused()
  await editor
    .getByLabel('Document name', { exact: true })
    .fill('Reviewed source.pdf')
  await editor
    .getByRole('button', { name: 'Save reference', exact: true })
    .click()
  await expect(editor).toHaveCount(0)
  await page.reload()
  await table
    .getByRole('link', {
      name: 'FOR-18 Upgrade the Mark LXXXV armor',
      exact: true,
    })
    .click()
  const taskEditor = page.getByRole('dialog', {
    name: 'Edit task',
    exact: true,
  })
  await taskEditor.getByRole('tab', { name: 'Files', exact: true }).click()
  await expect(taskEditor.getByText('Reviewed source.pdf')).toBeVisible()
  await taskEditor
    .getByRole('link', { name: 'Manage document references' })
    .click()
  await table
    .getByRole('button', { name: 'Reviewed source.pdf', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Remove reference', exact: true })
    .click()
  await expect(
    table.getByRole('button', { name: 'Reviewed source.pdf', exact: true }),
  ).toHaveCount(1)
  await editor
    .getByRole('button', { name: 'Confirm remove', exact: true })
    .click()
  await expect(
    page.getByText(
      'Reference removed locally. The source document was not deleted.',
    ),
  ).toBeVisible()
  await expect(table.getByText('No matching references')).toBeVisible()
})

test('merges concurrent registrations and rejects a stale editor across tabs', async ({
  page,
  context,
}) => {
  const other = await context.newPage()
  await page.goto('/modules/documents/library')
  await other.goto('/modules/documents/library')
  await page
    .getByRole('link', { name: '+ Register reference', exact: true })
    .click()
  await other
    .getByRole('link', { name: '+ Register reference', exact: true })
    .click()
  await fillReference(page, 'First source.pdf')
  await fillReference(other, 'Second source.pdf')
  await Promise.all([
    page
      .getByRole('button', { name: 'Register reference', exact: true })
      .click(),
    other
      .getByRole('button', { name: 'Register reference', exact: true })
      .click(),
  ])
  for (const current of [page, other]) {
    await current.getByRole('link', { name: 'Library', exact: true }).click()
    await expect(
      current.getByRole('button', { name: 'First source.pdf', exact: true }),
    ).toBeVisible()
    await expect(
      current.getByRole('button', { name: 'Second source.pdf', exact: true }),
    ).toBeVisible()
    await current
      .getByRole('button', { name: 'First source.pdf', exact: true })
      .click()
  }
  await page
    .getByLabel('Document name', { exact: true })
    .fill('Updated first.pdf')
  await page
    .getByRole('button', { name: 'Save reference', exact: true })
    .click()
  await expect(page.getByText('Reference updated locally.')).toBeVisible()
  await other
    .getByLabel('Document name', { exact: true })
    .fill('Stale first.pdf')
  await other
    .getByRole('button', { name: 'Save reference', exact: true })
    .click()
  await expect(other.getByRole('alert')).toContainText(
    'changed in another view',
  )
  await expect(other.getByLabel('Document name', { exact: true })).toHaveValue(
    'Stale first.pdf',
  )
  await other.getByRole('button', { name: 'Close document editor' }).click()
  await expect(
    other.getByRole('button', { name: 'Updated first.pdf', exact: true }),
  ).toBeVisible()
  await expect(
    other.getByRole('button', { name: 'Second source.pdf', exact: true }),
  ).toBeVisible()
})

test('blocks editing unreadable data and keeps the original storage', async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{invalid'),
    storageKey,
  )
  await page.goto('/modules/documents/library')
  await expect(page.getByRole('alert')).toContainText(
    'References could not be loaded',
  )
  await expect(page.getByText('No matching references')).toHaveCount(0)
  await page
    .getByRole('link', { name: '+ Register reference', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText(
    'References could not be loaded',
  )
  await expect(
    page.getByRole('form', { name: 'Register document reference' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBe('{invalid')
})

test('finds unavailable task links and reassigns them without changing the source', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key) !== null) return
    const source = {
      projectId: 'project-1',
      location: 'DOC-100',
      createdAt: '2026-11-02T00:00:00.000Z',
    }
    localStorage.setItem(
      key,
      JSON.stringify([
        { ...source, id: 'stale', taskId: 'FOR-999', name: 'Stale link.pdf' },
        { ...source, id: 'linked', taskId: 'FOR-18', name: 'Linked.pdf' },
        { ...source, id: 'project', name: 'Project source.pdf' },
      ]),
    )
  }, storageKey)
  await page.goto('/modules/documents/library')
  const table = page.getByRole('table', { name: 'Document references' })
  const unavailable = page
    .getByRole('article')
    .filter({ hasText: 'Unavailable task links' })
  const scope = page.getByRole('combobox', { name: 'Link scope', exact: true })

  await expect(unavailable.getByText('1', { exact: true })).toBeVisible()
  await scope.selectOption('linked')
  await expect(
    table.getByRole('button', { name: 'Linked.pdf', exact: true }),
  ).toBeVisible()
  await expect(
    table.getByRole('button', { name: 'Stale link.pdf' }),
  ).toHaveCount(0)
  await scope.selectOption('unavailable')
  await expect(table.getByText('Unavailable task · FOR-999')).toBeVisible()
  await expect(
    table.getByRole('button', { name: 'Linked.pdf', exact: true }),
  ).toHaveCount(0)
  await expect(
    table.getByRole('button', { name: 'Project source.pdf' }),
  ).toHaveCount(0)
  await table.getByRole('button', { name: 'Stale link.pdf' }).click()
  const editor = page.getByRole('dialog', { name: 'Document reference editor' })
  await editor.getByLabel('Linked task', { exact: true }).selectOption('FOR-18')
  await editor
    .getByRole('button', { name: 'Save reference', exact: true })
    .click()
  await expect(unavailable.getByText('0', { exact: true })).toBeVisible()
  await expect(table.getByText('No matching references')).toBeVisible()

  await page.reload()
  const repaired = table.getByRole('row').filter({ hasText: 'Stale link.pdf' })
  await expect(repaired.getByRole('link', { name: /FOR-18/ })).toBeVisible()
  await expect(repaired.getByText('DOC-100')).toBeVisible()
})

test('contains table scrolling on a 375px phone and treats non-web sources as text', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify(
          Array.from({ length: 60 }, (_, index) => ({
            id: `doc-${index}`,
            projectId: 'project-1',
            name: `Source ${String(index).padStart(2, '0')}.pdf`,
            location: index === 0 ? 'javascript:alert(1)' : `DOC-${index}`,
            createdAt: '2026-11-02T00:00:00.000Z',
          })),
        ),
      ),
    storageKey,
  )
  await page.goto('/modules/documents/library')
  const scroll = page.getByRole('region', { name: 'Document library table' })
  await expect(
    page.getByRole('button', { name: 'Source 00.pdf', exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    375,
  )
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
  await expect(
    page.getByRole('link', { name: 'Open source for Source 00.pdf' }),
  ).toHaveCount(0)
  await page
    .getByRole('searchbox', { name: 'Search references' })
    .fill('Source 00')
  await page.getByRole('button', { name: 'Source 00.pdf', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Document reference editor' })
  await expect(editor).toBeVisible()
  await expect(editor.getByLabel('Document name', { exact: true })).toHaveValue(
    'Source 00.pdf',
  )
  await editor.getByLabel('Document name', { exact: true }).press('Escape')
  await expect(editor).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Source 00.pdf', exact: true }),
  ).toBeFocused()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Rows per page', exact: true })
    .selectOption('50')
  await expect(page.getByText('1–50 of 60 references')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('51–60 of 60 references')).toBeVisible()
})
