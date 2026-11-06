import { expect, test } from '@playwright/test'
import type { Task } from '../../src/entities/task/model/task'

const tasks: Task[] = [
  {
    id: 'FOR-81',
    projectId: 'project-1',
    title: 'Delivery review',
    status: 'todo',
    priority: 'high',
    assigneeId: 'member-2',
    dueDate: '2000-01-01',
  },
  {
    id: 'FOR-82',
    projectId: 'project-1',
    title: 'Delivery handoff',
    status: 'in-progress',
    priority: 'urgent',
    assigneeId: 'member-1',
  },
  {
    id: 'FOR-83',
    projectId: 'project-1',
    title: 'Completed delivery',
    status: 'done',
    priority: 'low',
    assigneeId: 'member-2',
    dueDate: '2000-01-01',
  },
  {
    id: 'FOR-84',
    projectId: 'project-1',
    title: 'Unassigned intake',
    status: 'backlog',
    priority: 'medium',
  },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
  await page.addInitScript((snapshot) => {
    localStorage.setItem('forma:tasks:v1:project-1', JSON.stringify(snapshot))
  }, tasks)
})

test('combines task filters, restores them on reload and clears the URL', async ({
  page,
}) => {
  await page.goto('/modules/work/tasks')
  await page.getByRole('searchbox', { name: 'Search tasks' }).fill('Delivery')
  await page
    .getByRole('combobox', { name: 'Priority', exact: true })
    .selectOption('high')
  await page.getByRole('button', { name: /^Open 3$/ }).click()
  await expect(page.getByText('Showing 1 of 4 tasks')).toBeVisible()
  await expect(page).toHaveURL(/scope=open/)
  await page.reload()
  await expect(
    page.getByRole('searchbox', { name: 'Search tasks' }),
  ).toHaveValue('Delivery')
  await expect(
    page.getByRole('combobox', { name: 'Priority', exact: true }),
  ).toHaveValue('high')
  await expect(
    page.getByRole('link', { name: 'Delivery review', exact: true }),
  ).toHaveAttribute('href', '/workspaces/forma/projects/project-1?task=FOR-81')
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page).toHaveURL(/\/modules\/work\/tasks$/)
  await expect(page.getByText('Showing 4 of 4 tasks')).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Assignee', exact: true })
    .selectOption('unassigned')
  await expect(page.getByText('Showing 1 of 4 tasks')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Unassigned intake' }),
  ).toBeVisible()
})

test('separates overdue from completed work and protects personal ownership', async ({
  page,
}) => {
  await page.goto('/modules/work/tasks?scope=overdue')
  await expect(
    page.getByRole('link', { name: 'Delivery review', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Completed delivery' }),
  ).toHaveCount(0)
  await page.goto('/modules/work/my-tasks?assignee=member-1')
  await expect(page.getByText('Showing 2 of 2 tasks')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Delivery handoff' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Completed delivery' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /^Completed 1$/ }).click()
  await expect(page.getByText('Showing 1 of 2 tasks')).toBeVisible()
})

test('new task opens the established editor and projects expose progress/view links', async ({
  page,
}) => {
  await page.goto('/modules/work/projects')
  await expect(
    page.getByRole('progressbar', { name: 'Project task completion' }),
  ).toHaveAttribute('value', '25')
  const views = page.getByRole('navigation', { name: 'Open project view' })
  await views.getByRole('link', { name: 'Table', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Dense project inventory' }),
  ).toBeVisible()
  await page.goto('/modules/work/tasks')
  await page.getByRole('link', { name: 'New task', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Create task' })).toBeVisible()
})

test('shows saved task comments in the project activity feed and returns to the task', async ({
  page,
}) => {
  await page.goto('/modules/work/activity')
  await expect(page.getByText('No saved activity yet')).toBeVisible()
  await page.goto('/workspaces/forma/projects/project-1?task=FOR-81')
  const drawer = page.getByRole('dialog', { name: 'Edit task' })
  await drawer.getByRole('tab', { name: 'Activity', exact: true }).click()
  await drawer.getByLabel('Add comment').fill('Reviewed delivery documents')
  await drawer.getByRole('button', { name: 'Comment', exact: true }).click()
  await expect(drawer.getByText('Comment saved locally.')).toBeVisible()
  await page.goto('/modules/work/activity')
  await expect(page.getByText('Reviewed delivery documents')).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Activity type' })
    .selectOption('event')
  await expect(page.getByText('No matching activity')).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Activity type' })
    .selectOption('comment')
  await page.getByRole('link', { name: 'Delivery review', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
})

test('keeps task filters inside the phone viewport with internally scrolling table', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/modules/work/tasks')
  const input = page.getByRole('searchbox', { name: 'Search tasks' })
  await expect(input).toBeVisible()
  expect(await input.evaluate((el) => getComputedStyle(el).fontSize)).toBe(
    '16px',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  const region = page.getByRole('region', { name: 'Scrollable task table' })
  expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: /^Overdue 1$/ }).click()
  await expect(page.getByText('Showing 1 of 4 tasks')).toBeVisible()
})

test('preserves simultaneous comments and refreshes activity across tabs', async ({
  page,
  context,
}) => {
  const other = await context.newPage()
  await other.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
  await page.goto('/workspaces/forma/projects/project-1?task=FOR-81')
  await other.goto('/workspaces/forma/projects/project-1?task=FOR-81')
  const firstDrawer = page.getByRole('dialog', { name: 'Edit task' })
  const otherDrawer = other.getByRole('dialog', { name: 'Edit task' })
  await firstDrawer.getByRole('tab', { name: 'Activity', exact: true }).click()
  await otherDrawer.getByRole('tab', { name: 'Activity', exact: true }).click()
  await firstDrawer.getByLabel('Add comment').fill('First concurrent update')
  await otherDrawer.getByLabel('Add comment').fill('Second concurrent update')
  await Promise.all([
    firstDrawer.getByRole('button', { name: 'Comment', exact: true }).click(),
    otherDrawer.getByRole('button', { name: 'Comment', exact: true }).click(),
  ])
  await expect(firstDrawer.getByText('Comment saved locally.')).toBeVisible()
  await expect(otherDrawer.getByText('Comment saved locally.')).toBeVisible()
  await page.goto('/modules/work/activity')
  await expect(page.getByText('First concurrent update')).toBeVisible()
  await expect(page.getByText('Second concurrent update')).toBeVisible()
  await otherDrawer
    .getByLabel('Add comment')
    .fill('Live update from another tab')
  await otherDrawer
    .getByRole('button', { name: 'Comment', exact: true })
    .click()
  await expect(page.getByText('Live update from another tab')).toBeVisible()
  await other.close()
})

test('ignores activity from another project, removed tasks and malformed scopes', async ({
  page,
}) => {
  await page.goto('/modules/work/activity')
  await expect(page.getByText('No saved activity yet')).toBeVisible()
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('forma-workspace', 3)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('open failed'))
    })
    const transaction = db.transaction('task-activity', 'readwrite')
    const store = transaction.objectStore('task-activity')
    const entry = {
      id: 'scoped',
      projectId: 'project-1',
      taskId: 'FOR-81',
      kind: 'comment',
      body: 'Valid saved comment',
      createdAt: '2026-11-01T08:00:00Z',
    }
    store.put({
      scopeKey: 'project-1:FOR-81',
      projectId: 'project-1',
      taskId: 'FOR-81',
      entries: [
        entry,
        {
          ...entry,
          id: 'mixed',
          projectId: 'project-2',
          body: 'Hidden mixed scope',
        },
      ],
      updatedAt: entry.createdAt,
    })
    store.put({
      scopeKey: 'project-2:FOR-81',
      projectId: 'project-2',
      taskId: 'FOR-81',
      entries: [
        { ...entry, projectId: 'project-2', body: 'Hidden other project' },
      ],
      updatedAt: entry.createdAt,
    })
    store.put({
      scopeKey: 'project-1:removed',
      projectId: 'project-1',
      taskId: 'removed',
      entries: [{ ...entry, taskId: 'removed', body: 'Hidden removed task' }],
      updatedAt: entry.createdAt,
    })
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('write failed'))
    })
    db.close()
  })
  await page.getByRole('button', { name: 'Refresh activity' }).click()
  await expect(page.getByText('Valid saved comment')).toBeVisible()
  await expect(page.getByText('1 saved update', { exact: true })).toBeVisible()
  await expect(page.getByText(/Hidden/)).toHaveCount(0)
})
