import { test, expect, type Page } from '@playwright/test';
import { join } from 'node:path';
import { blueSquare } from '../e2e/blue-square.mjs';

/** A pretend agent's call, through the test server's own door. */
async function agent(
  page: Page,
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
) {
  const response = await page.request.post('/__test/agent', {
    data: { method, path, data },
  });
  expect(response.ok()).toBe(true);
  return (await response.json()) as any;
}

const circle = { kind: 'circle', name: 'C0', centre: 'O', through: 'A' };
const line = { kind: 'line', name: 'L0', from: 'O', to: 'A' };
const photo = join(
  import.meta.dirname,
  '../../player/public/photos/cairo-minbar-doors-met.jpg',
);

async function signIn(page: Page) {
  await page.goto('/#/studio');
  await page.getByRole('link', { name: 'Sign in with Google' }).click();
  await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();
}

test('a visitor uses Tastir without signing in, and the studio asks to', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /star/i }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Studio', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Your work', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Sign in to see your Studio projects' }),
  ).toBeVisible();
  await page.goto('/#/studio');
  await expect(
    page.getByRole('heading', { name: 'Sign in to use the studio' }),
  ).toBeVisible();
  await expect(page.getByText('Everything else in Tastir works')).toBeVisible();
  expect((await page.request.get('/api/projects')).status()).toBe(401);
  const scroll = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  expect(scroll).toBeLessThanOrEqual(0);
});

test('online projects appear in Your work and open their colored repeating wall', async ({
  page,
}) => {
  await signIn(page);
  const id = await blueSquare(
    (method, path, data) => agent(page, method, path, data),
    'Online square check',
  );
  await page.goto('/');
  await page.getByRole('link', { name: 'Your work', exact: true }).click();
  const projects = page.getByRole('region', { name: 'Studio projects' });
  const project = projects.locator(`a[href="#/studio/${id}"]`);
  await expect(project).toBeVisible();
  await expect(project).toContainText('Online square check');
  await expect(project.locator('img')).toHaveJSProperty('naturalWidth', 360);
  await project.click();
  await expect(
    page.getByText(/This shape is the tile that repeats\./),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'View finished wall', exact: true })
    .click();
  await expect(page.locator('.label')).toHaveText('Color');
  const wall = page.getByRole('img', {
    name: 'The pattern repeated as a wall',
  });
  await expect(wall).toBeVisible();
  await expect(wall.locator('pattern')).toHaveCount(1);
  await expect
    .poll(() => wall.locator('pattern [fill="#2453a6"]').count())
    .toBeGreaterThan(0);
  expect((await agent(page, 'GET', `/projects/${id}`)).revision).toBe(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test('the signed-in owner and an agent work on one drawing', async ({
  page,
}) => {
  await signIn(page);
  await page
    .getByRole('textbox', { name: 'New project from O and A' })
    .fill('Hosted drawing');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page).toHaveURL(/#\/studio\/hosted-drawing-/);
  const id = page.url().split('/').at(-1)!;

  // The agent's change reaches the open page without a reload.
  await agent(page, 'POST', `/projects/${id}/edit`, {
    author: 'claude',
    revision: 1,
    edit: { op: 'construct', add: [circle] },
  });
  const steps = page.getByRole('navigation', { name: 'Steps' });
  await expect(steps).toContainText('Circle C0 about O through A.', {
    timeout: 8000,
  });

  // The owner's change is saved on the server.
  await page.getByRole('textbox', { name: 'Title' }).fill('Renamed online');
  await expect
    .poll(
      async () => (await agent(page, 'GET', `/projects/${id}`)).drawing.title,
    )
    .toBe('Renamed online');

  // A question from the agent, answered on the page.
  await agent(page, 'POST', `/projects/${id}/edit`, {
    author: 'claude',
    revision: 3,
    edit: { op: 'construct', add: [line] },
  });
  const asked = await agent(page, 'POST', `/projects/${id}/questions`, {
    author: 'claude',
    text: 'Is the line right?',
    about: 'L0',
  });
  const panel = page.getByRole('region', { name: 'Studio notes' });
  await expect(panel).toContainText('Is the line right?', { timeout: 8000 });
  await panel.getByLabel('Your answer to claude').fill('Yes.');
  await panel
    .getByRole('button', { name: /answer/i })
    .first()
    .click();
  await expect
    .poll(
      async () =>
        (
          await agent(
            page,
            'GET',
            `/projects/${id}/questions/${asked.question.id}`,
          )
        ).answer?.text,
    )
    .toBe('Yes.');
  const scroll = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  expect(scroll).toBeLessThanOrEqual(0);
});

test('a photo goes up, and a project exports and imports again', async ({
  page,
}) => {
  await signIn(page);
  const made = await agent(page, 'POST', '/projects', {
    author: 'claude',
    title: 'Round trip',
  });
  const id = made.project as string;
  await agent(page, 'POST', `/projects/${id}/edit`, {
    author: 'claude',
    revision: 1,
    edit: { op: 'construct', add: [circle] },
  });
  await page.goto(`/#/studio/${id}`);
  await page.getByLabel('Add a photo to recreate').setInputFiles(photo);
  await expect(
    page.getByRole('img', { name: 'The reference photo' }),
  ).toBeVisible({ timeout: 10_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export project' }).click();
  const zip = await (await download).path();

  await page.goto('/#/studio');
  await page.getByLabel(/Import a project/).setInputFiles(zip);
  await expect(page).toHaveURL(/#\/studio\/round-trip-/);
  expect(page.url()).not.toContain(id);
  await expect(page.getByRole('navigation', { name: 'Steps' })).toContainText(
    'Circle C0 about O through A.',
  );
  await expect(
    page.getByRole('img', { name: 'The reference photo' }),
  ).toBeVisible();
});
