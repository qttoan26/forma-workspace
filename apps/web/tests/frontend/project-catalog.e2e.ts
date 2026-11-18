import { expect, test, type Page } from '@playwright/test'

async function fillProject(page: Page, name: string, key: string) {
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  const form = page.getByRole('dialog', { name: 'Create project' })
  await expect(
    form.getByRole('textbox', { name: 'Project name' }),
  ).toBeFocused()
  await form.getByRole('textbox', { name: 'Project name' }).fill(name)
  await form.getByRole('textbox', { name: 'Project key' }).fill(key)
  return form
}

async function createProject(page: Page, name: string, key: string) {
  const form = await fillProject(page, name, key)
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(form).toBeHidden()
  return page.getByRole('article', { name, exact: true })
}

test.beforeEach(async ({ context }) => {
  await context.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
})

test('creates an empty project, persists its tasks and opens isolated Work views', async ({
  page,
}, testInfo) => {
  await page.goto('/modules/work/projects')
  const form = await fillProject(page, 'Website launch', 'web')
  await form
    .getByRole('textbox', { name: 'Description' })
    .fill('Ship the new website')
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  const row = page.getByRole('article', { name: 'Website launch', exact: true })
  await expect(row.getByText('0 tasks · 0 members · 0% complete')).toBeVisible()
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('project-catalog-desktop.png'),
  })
  const href = await row
    .getByRole('link', { name: 'Open project', exact: true })
    .getAttribute('href')
  expect(href).toMatch(/\/workspaces\/forma\/projects\/project-/)
  await row.getByRole('link', { name: 'Open project', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Website launch', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Upgrade the Mark LXXXV armor')).toHaveCount(0)
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Create task', exact: true })
  await editor
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Write project brief')
  await editor.getByRole('button', { name: 'Create task', exact: true }).click()
  await expect(editor).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const request = indexedDB.open('forma-workspace', 3)
        const database = await new Promise<IDBDatabase>((resolve) => {
          request.onsuccess = () => resolve(request.result)
        })
        try {
          const read = database
            .transaction('project-tasks', 'readonly')
            .objectStore('project-tasks')
            .get(
              decodeURIComponent(location.pathname.split('/').at(-1) ?? ''),
            ) as IDBRequest<{ tasks: { title: string }[] } | undefined>
          return await new Promise<boolean>((resolve) => {
            read.onsuccess = () =>
              resolve(
                read.result?.tasks.some(
                  (task) => task.title === 'Write project brief',
                ) ?? false,
              )
          })
        } finally {
          database.close()
        }
      }),
    )
    .toBe(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Write project brief' }),
  ).toBeVisible()
  const picker = page.getByRole('combobox', { name: 'Current project' })
  const projectId = await picker.inputValue()
  await picker.selectOption('project-1')
  await expect(
    page.getByRole('heading', { name: 'Avengers Initiative', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Write project brief' }),
  ).toHaveCount(0)
  await page
    .getByRole('combobox', { name: 'Current project' })
    .selectOption(projectId)
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Open Write project brief', exact: true }),
  ).toBeVisible()
  for (const view of ['List', 'Calendar', 'Timeline', 'Files']) {
    await page
      .getByRole('navigation', { name: 'Project views' })
      .getByRole('button', { name: view, exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`view=${view.toLowerCase()}`))
    await expect(
      page.getByRole('heading', { name: 'Website launch', exact: true }),
    ).toBeVisible()
  }
  await page.goto(`/modules/work/tasks?project=${projectId}`)
  await expect(
    page.getByRole('link', { name: 'Write project brief', exact: true }),
  ).toHaveAttribute('href', `${href}?task=WEB-01`)
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Current project' }),
  ).toHaveValue(projectId)
  await page
    .getByRole('combobox', { name: 'Current project' })
    .selectOption('project-1')
  await expect(page).toHaveURL(/\/modules\/work\/tasks$/)
  await expect(
    page.getByRole('link', { name: 'Write project brief', exact: true }),
  ).toHaveCount(0)
  await page.goto('/modules/work/projects?query=website')
  await expect(
    page
      .getByRole('article', { name: 'Website launch', exact: true })
      .getByText('1 tasks · 0 members · 0% complete'),
  ).toBeVisible()
  await expect(
    page.getByRole('article', { name: 'Avengers Initiative', exact: true }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('searchbox', { name: 'Search projects' }),
  ).toHaveValue('website')
  await page
    .getByRole('searchbox', { name: 'Search projects' })
    .fill('missing-project')
  await expect(
    page.getByRole('heading', { name: 'No matching projects' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Website launch', exact: true }),
  ).toBeVisible()
  await page.goto(`${href}?view=table&task=WEB-01`)
  await expect(
    page.getByRole('dialog', { name: 'Task details', exact: true }),
  ).toContainText('Write project brief')
})

test('validates creation, preserves failed input and restores focus on cancel', async ({
  page,
}) => {
  await page.goto('/modules/work/projects')
  const form = await fillProject(page, 'A new project', 'FOR')
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(form.getByRole('alert')).toHaveText(
    'A project with this key already exists.',
  )
  await form.getByRole('textbox', { name: 'Project key' }).fill('1bad')
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(
    form.getByText('Use 2–10 letters or numbers, starting with a letter.'),
  ).toBeVisible()
  await form.getByRole('textbox', { name: 'Project key' }).fill('APP')
  await page.evaluate(() => {
    const original = Reflect.get<IDBDatabase, 'transaction'>(
      IDBDatabase.prototype,
      'transaction',
    )
    Object.defineProperty(window, '__restoreCatalogTransaction', {
      configurable: true,
      value: () => {
        IDBDatabase.prototype.transaction = original
      },
    })
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<IDBDatabase['transaction']>
    ) {
      if (this.name === 'forma-project-catalog' && args[1] === 'readwrite')
        throw new DOMException(
          'Project storage quota exceeded.',
          'QuotaExceededError',
        )
      return original.apply(this, args)
    }
  })
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(form.getByRole('alert')).toHaveText(
    'Project storage quota exceeded.',
  )
  await expect(form.getByRole('textbox', { name: 'Project name' })).toHaveValue(
    'A new project',
  )
  await page.evaluate(() => {
    ;(
      window as unknown as { __restoreCatalogTransaction: () => void }
    ).__restoreCatalogTransaction()
  })
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(form).toBeHidden()
  await expect(
    page.getByRole('article', { name: 'A new project', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'New project', exact: true }),
  ).toBeFocused()
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(2)
})

test('refreshes across tabs and prevents concurrent duplicate keys', async ({
  page,
  context,
}) => {
  const other = await context.newPage()
  await page.goto('/modules/work/projects')
  await other.goto('/modules/work/projects')
  const one = await fillProject(page, 'First concurrent project', 'SYNC')
  const two = await fillProject(other, 'Second concurrent project', 'sync')
  await Promise.all([
    one.getByRole('button', { name: 'Create project', exact: true }).click(),
    two.getByRole('button', { name: 'Create project', exact: true }).click(),
  ])
  await expect
    .poll(
      async () =>
        (await page.getByRole('dialog').count()) +
        (await other.getByRole('dialog').count()),
    )
    .toBe(1)
  const failed = (await one.count()) ? one : two
  await expect(failed.getByRole('alert')).toHaveText(
    'A project with this key already exists.',
  )
  await failed.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await expect(other.getByRole('article')).toHaveCount(2)
  await createProject(other, 'Another project', 'NEXT')
  await expect(
    page.getByRole('article', { name: 'Another project', exact: true }),
  ).toBeVisible()
  await other.close()
})

test('isolates account catalogs and rejects a custom-project deep link from another account', async ({
  page,
}) => {
  await page.goto('/modules/work/projects')
  const row = await createProject(page, 'Private local project', 'LOCAL')
  const href = await row
    .getByRole('link', { name: 'Open project', exact: true })
    .getAttribute('href')
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'another-account' }),
    }),
  )
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.goto(href ?? '')
  await expect(
    page.getByRole('heading', { name: 'Project not found' }),
  ).toBeVisible()
  await page.unroute('**/api/auth/me')
  await page.goto('/modules/work/projects')
  await expect(
    page.getByRole('article', { name: 'Private local project', exact: true }),
  ).toBeVisible()
})

test('reports unreadable catalog records and preserves them', async ({
  page,
}) => {
  await page.goto('/modules/work/projects')
  await createProject(page, 'Unmodified project', 'KEEP')
  await page.evaluate(async () => {
    const request = indexedDB.open('forma-project-catalog', 1)
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
    try {
      const transaction = db.transaction('projects', 'readwrite')
      const store = transaction.objectStore('projects')
      const cursor = store.openCursor()
      cursor.onsuccess = () => {
        if (cursor.result)
          cursor.result.update({
            ...(cursor.result.value as object),
            project: { id: 'broken' },
          })
      }
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Catalog write failed'))
      })
    } finally {
      db.close()
    }
  })
  await page.reload()
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Saved projects could not be loaded.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'New project', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'New project', exact: true }),
  ).toBeDisabled()
  const count = await page.evaluate(async () => {
    const request = indexedDB.open('forma-project-catalog', 1)
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
    try {
      const read = db
        .transaction('projects', 'readonly')
        .objectStore('projects')
        .count()
      return await new Promise<number>((resolve) => {
        read.onsuccess = () => resolve(read.result)
      })
    } finally {
      db.close()
    }
  })
  expect(count).toBe(1)
})

test('keeps project search, long names and creation usable on a phone', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/modules/work/projects')
  const form = await fillProject(page, 'A'.repeat(120), 'LONGKEY123')
  expect(
    await form
      .getByRole('textbox', { name: 'Project name' })
      .evaluate((element) => getComputedStyle(element).fontSize),
  ).toBe('16px')
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('project-create-mobile.png'),
  })
  await form
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(page.getByRole('article')).toHaveCount(2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page
    .getByRole('searchbox', { name: 'Search projects' })
    .fill('LONGKEY123')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('project-catalog-mobile.png'),
  })
})

test('keeps Work, Documents and Production linked to the selected account project', async ({
  page,
  context,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('forma-workspace:sidebar-expanded:v1', 'true'),
  )
  await page.goto('/modules/work/projects')
  const row = await createProject(page, 'Linked operations', 'LINK')
  await row.getByRole('link', { name: 'Open project', exact: true }).click()
  const projectId = await page
    .getByRole('combobox', { name: 'Current project' })
    .inputValue()
  const query = `?project=${encodeURIComponent(projectId)}`
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  const taskEditor = page.getByRole('dialog', {
    name: 'Create task',
    exact: true,
  })
  await taskEditor
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Prepare linked source')
  await taskEditor
    .getByRole('button', { name: 'Create task', exact: true })
    .click()
  await expect(taskEditor).toBeHidden()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Prepare linked source', exact: true }),
  ).toBeVisible()

  // Search navigation must carry the same scope as the sidebar and project picker.
  await page
    .getByRole('button', { name: 'Search workspace navigation' })
    .click()
  await page
    .getByRole('searchbox', { name: 'Find a module or section' })
    .fill('Document intake')
  const searchResults = page.getByRole('navigation', {
    name: 'Navigation search results',
  })
  const intakeResult = searchResults.locator(
    'a[href^="/modules/documents/intake"]',
  )
  await expect(intakeResult).toHaveAttribute(
    'href',
    `/modules/documents/intake${query}`,
  )
  await intakeResult.click()
  await expect(
    page.getByRole('combobox', { name: 'Current project' }),
  ).toHaveValue(projectId)
  await page
    .getByLabel('Document name', { exact: true })
    .fill('Linked brief.pdf')
  await page
    .getByLabel('Reference location', { exact: true })
    .fill('DOC-LINKED-1')
  await page
    .getByRole('combobox', { name: 'Linked task', exact: true })
    .selectOption('LINK-01')
  await page
    .getByRole('button', { name: 'Register reference', exact: true })
    .click()
  await expect(page.getByText('Reference registered locally.')).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Document workspace views' })
    .getByRole('link', { name: 'Library', exact: true })
    .click()
  await expect(page).toHaveURL(`/modules/documents/library${query}`)
  const documents = page.getByRole('table', { name: 'Document references' })
  await expect(
    documents.getByRole('button', { name: 'Linked brief.pdf', exact: true }),
  ).toBeVisible()
  await expect(
    documents.getByRole('link', { name: /LINK-01/ }),
  ).toHaveAttribute(
    'href',
    `/workspaces/forma/projects/${projectId}?view=files&task=LINK-01`,
  )

  // Enter Production through the real module menu, then validate fresh sources on save.
  await page.getByRole('button', { name: 'Expand Production sections' }).click()
  await page
    .getByRole('navigation', { name: 'Production sections', exact: true })
    .getByRole('link', { name: 'Job intake', exact: true })
    .click()
  await expect(page).toHaveURL(`/modules/production/intake${query}`)
  await expect(page.getByRole('checkbox', { name: /FOR-18/ })).toHaveCount(0)
  await page.getByLabel('Package name', { exact: true }).fill('Linked package')
  await page
    .getByRole('checkbox', {
      name: 'LINK-01 Prepare linked source',
      exact: true,
    })
    .check()
  await page
    .getByRole('checkbox', { name: 'Linked brief.pdf', exact: true })
    .check()
  await page
    .getByRole('button', { name: 'Save draft package', exact: true })
    .click()
  await expect(
    page.getByText(/^Draft work package saved locally/),
  ).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Production workspace views' })
    .getByRole('link', { name: 'Queue', exact: true })
    .click()
  await expect(page).toHaveURL(`/modules/production/queue${query}`)
  await page.reload()
  const packages = page.getByRole('table', { name: 'Work packages' })
  await expect(
    packages.getByRole('link', { name: 'LINK-01', exact: true }),
  ).toHaveAttribute(
    'href',
    `/workspaces/forma/projects/${projectId}?task=LINK-01`,
  )
  for (const section of ['processing', 'quality', 'delivery']) {
    await expect(
      page
        .getByRole('navigation', { name: 'Production workspace views' })
        .locator(`a[href^="/modules/production/${section}"]`),
    ).toHaveAttribute('href', `/modules/production/${section}${query}`)
  }

  // A source deleted in another tab is detected; it cannot silently enter the queue.
  await packages
    .getByRole('button', { name: 'Linked package', exact: true })
    .click()
  const editor = page.getByRole('dialog', { name: 'Work package editor' })
  const other = await context.newPage()
  await other.goto(`/modules/documents/library${query}`)
  await other
    .getByRole('button', { name: 'Linked brief.pdf', exact: true })
    .click()
  await other
    .getByRole('button', { name: 'Remove reference', exact: true })
    .click()
  await other
    .getByRole('button', { name: 'Confirm remove', exact: true })
    .click()
  await expect(
    editor.getByRole('button', { name: 'Queue package', exact: true }),
  ).toBeDisabled()
  await editor
    .getByRole('checkbox', { name: /Document .*unavailable/ })
    .uncheck()
  await editor
    .getByRole('button', { name: 'Save package', exact: true })
    .click()
  await packages
    .getByRole('button', { name: 'Linked package', exact: true })
    .click()
  await editor
    .getByRole('button', { name: 'Queue package', exact: true })
    .click()
  await expect(page.getByText('Work package queued locally.')).toBeVisible()
  await other.close()

  await page
    .getByRole('combobox', { name: 'Current project' })
    .selectOption('project-1')
  await expect(page).toHaveURL('/modules/production/queue')
  await expect(
    page.getByRole('button', { name: 'Linked package', exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole('combobox', { name: 'Current project' })
    .selectOption(projectId)
  await expect(
    packages.getByRole('button', { name: 'Linked package', exact: true }),
  ).toBeVisible()

  // Neither module may fall back to the sample's sources for an inaccessible ID.
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'another-account' }),
    }),
  )
  for (const module of ['documents/library', 'production/queue']) {
    await page.goto(`/modules/${module}${query}`)
    await expect(
      page.getByRole('alert').filter({ hasText: /could not be loaded/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Linked (brief|package)/ }),
    ).toHaveCount(0)
    await page
      .getByRole('combobox', { name: 'Current project' })
      .selectOption('project-1')
    await expect(
      page.getByRole('alert').filter({ hasText: /could not be loaded/ }),
    ).toHaveCount(0)
  }
})
