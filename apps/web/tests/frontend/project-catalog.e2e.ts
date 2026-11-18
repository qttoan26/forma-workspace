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
