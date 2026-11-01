import { expect, test } from '@playwright/test'
import type { Task } from '../../src/entities/task/model/task'

const tasks: Task[] = [
  {
    id: 'FOR-18',
    projectId: 'project-1',
    title: 'Create board interaction model',
    status: 'todo',
    priority: 'high',
    assigneeId: 'member-2',
  },
  {
    id: 'FOR-21',
    projectId: 'project-1',
    title: 'Build accessible task cards',
    status: 'in-progress',
    priority: 'urgent',
    assigneeId: 'member-2',
  },
  ...Array.from(
    { length: 58 },
    (_, index): Task => ({
      id: `FOR-${100 + index}`,
      projectId: 'project-1',
      title: `Inbox task ${index + 1}`,
      status: 'todo',
      priority: 'medium',
      assigneeId: 'member-2',
    }),
  ),
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

test('triages persisted read state and shares Inbox replies with the original task drawer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/modules/work/inbox')
  const list = page.getByRole('region', { name: 'Inbox notifications' })
  await expect(page.getByRole('tab', { name: 'Assignments 60' })).toBeVisible()
  expect(
    await list.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true)
  await list
    .getByRole('button', {
      name: /^Assigned to you Create board interaction model\./,
    })
    .click()
  const conversation = page.getByRole('region', { name: 'Inbox conversation' })
  await expect(conversation).toBeVisible()
  await conversation
    .getByLabel('Reply', { exact: true })
    .fill('Inbox conversation check')
  await conversation.getByRole('button', { name: 'Reply', exact: true }).click()
  await expect(conversation.getByText('Reply saved locally.')).toBeVisible()
  await expect(
    conversation.getByText('Inbox conversation check', { exact: true }),
  ).toBeVisible()
  await page.reload()
  await page.getByLabel('Unread', { exact: true }).check()
  await expect(
    list.getByRole('button', {
      name: /Assigned to you Create board interaction model/,
    }),
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Mark all as read', exact: true })
    .click()
  await expect(page.getByText('You’re all caught up')).toBeVisible()
  await page.getByLabel('Unread', { exact: true }).uncheck()
  await list
    .getByRole('button', {
      name: /^Assigned to you Create board interaction model\./,
    })
    .click()
  await page.getByRole('link', { name: 'Open task ↗' }).click()
  const drawer = page.getByRole('dialog', { name: 'Edit task' })
  await drawer.getByRole('tab', { name: 'Activity', exact: true }).click()
  await expect(
    drawer.getByText('Inbox conversation check', { exact: true }),
  ).toBeVisible()
})

test.describe('Phone inbox', () => {
  test.use({ isMobile: true, hasTouch: true })
  for (const width of [320, 393, 440]) {
    test(`keeps list/detail, drafts and the dock usable at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 852 })
      await page.goto('/modules/work/inbox')
      const list = page.getByRole('region', { name: 'Inbox notifications' })
      await expect(list).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width)
      await list
        .getByRole('button', {
          name: /^Assigned to you Create board interaction model\./,
        })
        .click()
      await expect(list).toBeHidden()
      const conversation = page.getByRole('region', {
        name: 'Inbox conversation',
      })
      await expect(conversation).toBeVisible()
      const reply = conversation.getByLabel('Reply', { exact: true })
      await reply.fill('Keep this phone draft')
      expect(
        await reply.evaluate((element) => getComputedStyle(element).fontSize),
      ).toBe('16px')
      await page.getByRole('button', { name: 'Back to inbox' }).click()
      await expect(list).toBeVisible()
      await expect(
        page.getByRole('searchbox', { name: 'Search inbox' }),
      ).toBeFocused()
      await list
        .getByRole('button', {
          name: /^Assigned to you Create board interaction model\./,
        })
        .click()
      await expect(reply).toHaveValue('Keep this phone draft')
      const inboxBounds = (await page
        .getByRole('region', { name: 'Project inbox' })
        .boundingBox())!
      const dockBounds = (await page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .boundingBox())!
      expect(inboxBounds.y + inboxBounds.height).toBeLessThanOrEqual(
        dockBounds.y,
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width)
    })
  }
})
