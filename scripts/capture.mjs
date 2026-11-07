import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const baseURL = process.env.CAPTURE_URL || 'http://127.0.0.1:18084';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1440, height: 1050 },
  timezoneId: 'Africa/Cairo',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
await mkdir(new URL('../docs/screenshots/', import.meta.url), { recursive: true });
const snap = async (name) => {
  await page.screenshot({
    path: new URL(`../docs/screenshots/${name}.png`, import.meta.url).pathname.replace(
      /^\/([A-Za-z]:)/,
      '$1',
    ),
    fullPage: true,
  });
};
await page.goto('/login');
await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
await snap('login');
await page.goto('/register');
await page.getByRole('heading', { name: 'Make space for progress' }).waitFor();
await snap('registration');
const email = `alex-${randomUUID()}@example.test`;
const password = randomUUID().concat('aA1!');
async function write(path, method, data) {
  const token = (await (await context.request.get('/api/account/csrf')).json()).token;
  const r = await context.request.fetch(`/api${path}`, {
    method,
    data,
    headers: { 'X-CSRF-TOKEN': token },
  });
  if (!r.ok()) throw new Error(`${path}: ${r.status()} ${await r.text()}`);
  return r.status() === 204 ? null : r.json();
}
await write('/account/register', 'POST', {
  email,
  password,
  displayName: 'Alex Morgan',
  timeZone: 'Africa/Cairo',
});
await write('/account/login', 'POST', { email, password });
const categories = [];
for (const name of ['Studio work', 'Personal', 'Learning', 'Wellbeing'])
  categories.push(await write('/categories', 'POST', { name }));
const { today } = await (await context.request.get('/api/dashboard')).json();
const day = (n) => {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const samples = [
  [
    'Prepare the brand direction presentation',
    'Gather the strongest concepts and prepare a clear narrative for the review.',
    0,
    2,
    1,
    1,
  ],
  [
    'Review the project proposal',
    'Check the scope, milestones and the next actions before sharing feedback.',
    0,
    3,
    0,
    -1,
  ],
  [
    'Read a chapter of Creative Confidence',
    'A little space for a fresh perspective. Capture one useful idea.',
    2,
    0,
    0,
    2,
  ],
  [
    'Plan next week’s priorities',
    'Choose three meaningful outcomes and leave room for the unexpected.',
    1,
    1,
    0,
    3,
  ],
  [
    'Take a long walk after work',
    'Step away from the screen and enjoy some breathing room.',
    3,
    1,
    0,
    0,
  ],
  [
    'Refine the portfolio case study',
    'Connect the problem, decisions and outcome in a short visual story.',
    0,
    2,
    1,
    4,
  ],
  [
    'Complete the accessibility review',
    'Check keyboard flow, labels, contrast and the mobile experience.',
    2,
    3,
    1,
    1,
  ],
  [
    'Organize the reference library',
    'Keep the useful references and archive the rest.',
    0,
    0,
    2,
    -2,
  ],
  ['Book the weekend workshop', 'Try something new and make time to learn.', 1, 1, 2, -1],
  [
    'Set up the reading corner',
    'A small change for a more thoughtful daily routine.',
    3,
    0,
    2,
    null,
  ],
];
const tasks = [];
for (const [title, description, category, priority, status, offset] of samples)
  tasks.push(
    await write('/tasks', 'POST', {
      title,
      description,
      categoryId: categories[category].id,
      priority,
      status,
      startDate: null,
      dueDate: offset === null ? null : day(offset),
    }),
  );
await mkdir(new URL('../.local/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../.local/demo-account.json', import.meta.url),
  JSON.stringify({ baseURL, email, password }, null, 2),
);
for (const [route, name, heading] of [
  ['/', 'dashboard', 'A little focus. Real progress.'],
  ['/tasks', 'task-list', 'Everything you’re working toward.'],
  ['/tasks/new', 'task-creation', 'What’s your next step?'],
  [`/tasks/${tasks[0].id}/edit`, 'task-editing', 'Refine the plan.'],
  ['/categories', 'categories', 'A place for every kind of work.'],
  ['/tasks?sort=priority', 'priorities', 'Everything you’re working toward.'],
  ['/deadlines?deadline=all', 'deadlines', 'Keep your commitments in view.'],
  ['/board', 'board', 'A clear path from plan to done.'],
]) {
  await page.goto(route);
  await page.getByRole('heading', { name: heading, exact: true }).waitFor();
  await page.waitForTimeout(1000);
  await snap(name);
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/');
await page.getByRole('heading', { name: 'A little focus. Real progress.' }).waitFor();
await page.waitForTimeout(1000);
await snap('mobile');
await writeFile(
  new URL('../docs/screenshots/capture.json', import.meta.url),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      baseURL,
      viewport: { desktop: '1440×1050', mobile: '390×844' },
      data: 'Fictional API-created account and tasks; credentials are stored only in ignored .local/demo-account.json.',
    },
    null,
    2,
  ),
);
await browser.close();
console.log(
  'Captured actual running Daymark screens. Demo credentials saved only in .local/demo-account.json.',
);
