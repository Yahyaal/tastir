import { expect, test, type Page } from '@playwright/test';

async function service(page: Page, initial: 'in' | 'out' | 'unavailable') {
  let state = initial;
  const calls: string[] = [];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    calls.push(path);
    const headers = { 'Content-Type': 'application/json' };
    if (path === '/api/feedback/config')
      return route.fulfill({ json: { enabled: false } });
    if (path === '/api/sign-in-options')
      return route.fulfill({ json: { chatgpt: false } });
    if (state !== 'in')
      return route.fulfill({
        status: state === 'out' ? 401 : 503,
        headers,
        body: JSON.stringify({
          error: state === 'out' ? 'Sign in' : 'Unavailable',
        }),
      });
    if (path === '/api/me') return route.fulfill({ json: { live: false } });
    if (path === '/api/projects')
      return route.fulfill({
        json: [
          {
            id: 'p1',
            title: 'Cloud test drawing',
            updated: '2026-11-15T12:00:00Z',
            revision: 1,
          },
        ],
      });
    if (path === '/api/contests') return route.fulfill({ json: [] });
    if (path.endsWith('/picture'))
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><circle cx="180" cy="180" r="100"/></svg>',
      });
    return route.fulfill({
      status: 404,
      json: { error: 'Unexpected mock request' },
    });
  });
  return {
    calls,
    state: (next: typeof initial) => {
      state = next;
    },
    protectedCount: () =>
      calls.filter((p) => p === '/api/me' || p === '/api/projects').length,
  };
}

test('signed-out Your work stays quiet through route changes and resumes after verified sign-in', async ({
  page,
}) => {
  const api = await service(page, 'out');
  await page.goto('/#/work');
  await expect(
    page.getByRole('link', { name: 'Sign in to see your Studio projects' }),
  ).toBeVisible();
  await page.waitForTimeout(2500);
  expect(api.calls.filter((p) => p === '/api/me')).toHaveLength(1);
  expect(api.calls.filter((p) => p === '/api/projects')).toHaveLength(0);
  await page.evaluate(() => {
    window.location.hash = '#/studio';
  });
  await expect(
    page.getByRole('heading', { name: 'Sign in to use the studio' }),
  ).toBeVisible();
  await page.evaluate(() =>
    document.dispatchEvent(new Event('visibilitychange')),
  );
  await page.waitForTimeout(1500);
  expect(api.protectedCount()).toBe(1);
  api.state('in');
  await page
    .getByRole('button', { name: 'Check sign-in', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Studio', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Cloud test drawing/ }),
  ).toBeVisible();
  expect(api.calls.filter((p) => p === '/api/me')).toHaveLength(2);
});

test('session expiry hides cached online projects and stops further background calls', async ({
  page,
}) => {
  const api = await service(page, 'in');
  await page.goto('/#/work');
  await expect(
    page.getByRole('link', { name: /Cloud test drawing/ }),
  ).toBeVisible();
  api.state('out');
  await expect(
    page.getByRole('link', { name: 'Sign in to see your Studio projects' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Cloud test drawing/ }),
  ).toHaveCount(0);
  const count = api.protectedCount();
  await page.waitForTimeout(3000);
  expect(api.protectedCount()).toBe(count);
  await page.evaluate(() => {
    window.location.hash = '#/studio';
  });
  await expect(
    page.getByRole('heading', { name: 'Sign in to use the studio' }),
  ).toBeVisible();
  expect(api.protectedCount()).toBe(count);
});

test('a temporary sign-in check failure shows a retry instead of polling protected resources', async ({
  page,
}) => {
  const api = await service(page, 'unavailable');
  await page.goto('/#/studio');
  await expect(
    page.getByRole('heading', { name: 'Studio is unavailable' }),
  ).toBeVisible();
  await page.waitForTimeout(2000);
  expect(api.protectedCount()).toBe(1);
  api.state('in');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Studio', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Cloud test drawing/ }),
  ).toBeVisible();
});
