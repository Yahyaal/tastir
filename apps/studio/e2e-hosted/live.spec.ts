import { test, expect, type Page } from '@playwright/test';

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

const circle = (name: string) => ({
  kind: 'circle',
  name,
  centre: 'O',
  through: 'A',
});

async function openProject(page: Page, title: string) {
  await page.goto('/#/studio');
  await page.getByRole('link', { name: 'Sign in with Google' }).click();
  await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();
  const made = await agent(page, 'POST', '/projects', {
    author: 'claude',
    title,
  });
  await page.goto(`/#/studio/${made.project}`);
  await expect(page.getByRole('navigation', { name: 'Steps' })).toBeVisible();
  return made.project as string;
}

test.afterEach(async ({ page }) => {
  // Back to the real room.
  expect((await page.request.get('/__test/room')).ok()).toBe(true);
});

test('an agent’s edit arrives through the live room at once', async ({
  page,
}) => {
  const id = await openProject(page, 'Live');
  // Let the page connect to its room.
  await page.waitForTimeout(1500);
  const steps = page.getByRole('navigation', { name: 'Steps' });
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await agent(page, 'POST', `/projects/${id}/edit`, {
      author: 'claude',
      revision: i,
      edit: { op: 'construct', add: [circle(`C${i}`)] },
    });
    await expect(steps).toContainText(`Circle C${i} about O`);
    const ms = Date.now() - start;
    console.log(`agent edit ${i} shown after ${ms} ms`);
    // Without the room the page checks every three seconds.
    expect(ms).toBeLessThan(1500);
  }
});

test('with the live room unreachable, the page still keeps up', async ({
  page,
}) => {
  await page.request.get('/__test/room?origin=http://127.0.0.1:9');
  const id = await openProject(page, 'No room');
  await agent(page, 'POST', `/projects/${id}/edit`, {
    author: 'claude',
    revision: 1,
    edit: { op: 'construct', add: [circle('C1')] },
  });
  await expect(page.getByRole('navigation', { name: 'Steps' })).toContainText(
    'Circle C1 about O',
    { timeout: 10_000 },
  );
  // The owner's own edit still saves.
  await page
    .getByRole('textbox', { name: 'Title' })
    .fill('Saved without a room');
  await expect
    .poll(
      async () => (await agent(page, 'GET', `/projects/${id}`)).drawing.title,
    )
    .toBe('Saved without a room');
});
