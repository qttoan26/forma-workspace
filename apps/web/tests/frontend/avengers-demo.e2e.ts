import { expect, test } from '@playwright/test'

test('shows all Avengers and the two tasks owned by each member, with Tony’s personal tasks and Inbox', async ({
  page,
}) => {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'member-2' }),
    }),
  )
  await page.goto('/modules/work/members')
  for (const name of [
    'Steve Rogers',
    'Tony Stark',
    'Thor',
    'Bruce Banner',
    'Natasha Romanoff',
    'Clint Barton',
  ]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible()
  }
  await page.goto('/modules/work/tasks')
  const table = page.getByRole('table', { name: 'Tasks', exact: true })
  for (const [id, title] of [
    ['member-1', 'Assemble the field response squad'],
    ['member-2', 'Upgrade the Mark LXXXV armor'],
    ['member-3', 'Map Bifrost evacuation routes'],
    ['member-4', 'Analyze gamma radiation signatures'],
    ['member-5', 'Review HYDRA intelligence reports'],
    ['member-6', 'Calibrate the tactical arrow loadout'],
  ]) {
    await page
      .getByRole('combobox', { name: 'Assignee', exact: true })
      .selectOption(id!)
    await expect(
      table.getByRole('link', { name: title!, exact: true }),
    ).toBeVisible()
    await expect(table.getByRole('row')).toHaveCount(3)
  }
  await page.goto('/modules/work/my-tasks')
  await expect(
    table.getByRole('link', {
      name: 'Upgrade the Mark LXXXV armor',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    table.getByRole('link', {
      name: 'Deploy the Ultron defense firewall',
      exact: true,
    }),
  ).toBeVisible()
  await expect(table.getByRole('row')).toHaveCount(3)
  await page.goto('/modules/work/inbox')
  await expect(page.getByRole('tab', { name: 'Assignments 2' })).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: /^Assigned to you Upgrade the Mark LXXXV armor/,
    }),
  ).toBeVisible()
})
