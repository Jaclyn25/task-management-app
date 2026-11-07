import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
async function account(page: Page) {
  const email = `daymark-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const password = crypto.randomUUID().concat('aA1!');
  await page.goto('/register');
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little focus. Real progress.' })).toBeVisible();
  return { email, password };
}
async function write(request: APIRequestContext, path: string, method: string, data?: unknown) {
  const token = (await (await request.get('/api/account/csrf')).json()).token;
  return request.fetch(`/api${path}`, { method, data, headers: { 'X-CSRF-TOKEN': token } });
}
async function create(page: Page, title: string, due?: string) {
  await page.goto('/tasks/new');
  await page.getByLabel(/Task title/).fill(title);
  await page.getByLabel('Description').fill('A clear next step for a fictional project.');
  await page.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('3');
  if (due) await page.getByLabel('Due date').fill(due);
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
test('register, sign in, create, edit, complete, reopen, delete and sign out', async ({ page }) => {
  await account(page);
  await create(page, 'Draft the launch checklist');
  await page.getByRole('link', { name: 'Edit task', exact: true }).click();
  await page.getByLabel(/Task title/).fill('Refine the launch checklist');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Refine the launch checklist' })).toBeVisible();
  await page.getByLabel('Task status').selectOption('2');
  await expect(page.getByText(/^Completed \w/)).toBeVisible();
  await page.getByLabel('Task status').selectOption('1');
  await expect(page.getByText(/^Completed \w/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete task' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText('A clear space')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
test('categories, priorities, search and filters persist', async ({ page }) => {
  await account(page);
  await page.goto('/categories');
  await page.getByLabel('Category name').fill('Creative work');
  await page.getByRole('button', { name: 'Create category' }).click();
  await expect(page.getByRole('link', { name: /Creative work/ })).toBeVisible();
  await create(page, 'Explore a new direction');
  await page.getByRole('link', { name: 'Edit task', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption({ label: 'Creative work' });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.goto('/tasks');
  await page.getByLabel('Search tasks').fill('direction');
  await page.getByLabel('Category filter').selectOption({ label: 'Creative work' });
  await page.getByLabel('Priority filter').selectOption('3');
  await expect(page.getByRole('link', { name: /Explore a new direction/ })).toBeVisible();
  await page.getByLabel('Priority filter').selectOption('0');
  await expect(page.getByText('A clear space')).toBeVisible();
});
test('deadline boundaries, dashboard and completed exclusion', async ({ page }) => {
  await account(page);
  await create(page, 'Resolve the overdue item', '2020-01-01');
  await expect(page.getByText(/Overdue ·/)).toBeVisible();
  await page.goto('/deadlines?deadline=overdue');
  await expect(page.getByRole('link', { name: /Resolve the overdue item/ })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('0 due in the next seven days · 1 overdue')).toBeVisible();
  await page
    .getByRole('link', { name: /Resolve the overdue item/ })
    .first()
    .click();
  await page.getByLabel('Task status').selectOption('2');
  await page.goto('/deadlines?deadline=overdue');
  await expect(page.getByText('A clear space')).toBeVisible();
});
test('private data cannot be accessed across users or without a session', async ({
  page,
  browser,
  baseURL,
}) => {
  await account(page);
  await create(page, 'Private personal plan');
  const id = page.url().split('/').pop()!;
  const other = await browser.newContext({ baseURL });
  const p = await other.newPage();
  await account(p);
  expect((await other.request.get(`/api/tasks/${id}`)).status()).toBe(404);
  expect((await write(other.request, `/tasks/${id}`, 'DELETE')).status()).toBe(404);
  const anonymous = await browser.newContext({ baseURL });
  expect((await anonymous.request.get('/api/tasks')).status()).toBe(401);
  expect((await anonymous.request.get('/api/dashboard')).status()).toBe(401);
  await p.goto(`/tasks/${id}`);
  await expect(p.getByRole('alert')).toContainText('Task not found.');
  await anonymous.close();
  await other.close();
});
test('mobile navigation and editor fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await account(page);
  await expect(page.getByRole('button', { name: 'Toggle navigation' })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'All tasks', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Everything you’re working toward.' }),
  ).toBeVisible();
  await create(page, 'A mobile next step');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('board moves persist across reload and completion', async ({ page }) => {
  await account(page);
  await create(page, 'Move a meaningful step');
  await page.goto('/board');
  await page.getByLabel('Move Move a meaningful step').selectOption('1');
  await expect(
    page.locator('.column-1').getByRole('heading', { name: 'Move a meaningful step' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('.column-1').getByRole('heading', { name: 'Move a meaningful step' }),
  ).toBeVisible();
  await page.getByLabel('Move Move a meaningful step').selectOption('2');
  await expect(
    page.locator('.column-2').getByRole('heading', { name: 'Move a meaningful step' }),
  ).toBeVisible();
});
