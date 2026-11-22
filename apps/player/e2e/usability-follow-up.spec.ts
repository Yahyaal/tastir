import { expect, test } from '@playwright/test';
const id = 'eight-fold-star-and-cross';

test('a variation saves immediately and its construction can be duplicated independently', async ({
  page,
}) => {
  await page.goto(`/#/${id}/result`);
  await expect(
    page.getByText(/Create and save a separate copy in this browser/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Make a variation', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/edit\/[^/]+$/);
  let original = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem('tastir.patterns')!)[0],
  );
  await page.reload();
  await page.goto('/#/work');
  original = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem('tastir.patterns')!)[0],
  );
  await page
    .locator('.pattern-actions')
    .getByRole('button', { name: 'Duplicate', exact: true })
    .click();
  await expect(page.locator('.personal-card')).toHaveCount(2);
  const patterns = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('tastir.patterns')!),
  );
  const copy = patterns.find((p: { id: string }) => p.id !== original.id);
  expect(patterns.find((p: { id: string }) => p.id === original.id)).toEqual(
    original,
  );
  expect(copy.tutorial.steps).toEqual(original.tutorial.steps);
  const card = page.locator('.personal-card').filter({
    has: page.getByRole('heading', {
      name: copy.tutorial.title,
      exact: true,
    }),
  });
  await expect(card.locator('svg.thumbnail')).toBeVisible();
  expect(
    await card
      .locator('.thumbnail')
      .evaluate((el) => window.getComputedStyle(el).borderTopLeftRadius),
  ).toBe('8px');
  await card.getByRole('link', { name: 'Play', exact: true }).click();
  await expect(page.locator('svg.wall')).toBeVisible();
  await page.reload();
  await expect(page.locator('svg.wall')).toBeVisible();
});

test('saved design copies preserve appearance, reopen, and are named on the home page', async ({
  page,
}) => {
  await page.goto(`/#/${id}/result`);
  await page.getByRole('button', { name: 'Chefchaouen', exact: true }).click();
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Blue original');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.goto('/#/work');
  const originalCard = page.locator('.personal-card').filter({
    has: page.getByRole('heading', { name: 'Blue original', exact: true }),
  });
  await originalCard
    .getByRole('button', { name: 'Duplicate', exact: true })
    .click();
  await expect(page.locator('.personal-card')).toHaveCount(2);
  await originalCard
    .getByRole('button', { name: 'Duplicate', exact: true })
    .click();
  await expect(page.locator('.personal-card')).toHaveCount(3);
  const designs = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('tastir.designs')!),
  );
  expect(new Set(designs.map((d: { id: string }) => d.id)).size).toBe(3);
  expect(designs.map((d: { coloring: unknown }) => d.coloring)).toEqual([
    designs[0].coloring,
    designs[0].coloring,
    designs[0].coloring,
  ]);
  const copy = page.locator('.personal-card').filter({
    has: page.getByRole('heading', {
      name: 'Blue original copy',
      exact: true,
    }),
  });
  await copy.locator('a.card').click();
  await expect(page.locator('svg.wall')).toBeVisible();
  await page.reload();
  await expect(page.locator('svg.wall')).toBeVisible();
  // The home names the work in its top bar; all of it is on #/work.
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Your work (3)', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('a refused duplicate shows an error and leaves the original stored', async ({
  page,
}) => {
  await page.goto(`/#/${id}/result`);
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Safe original');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.goto('/#/work');
  const before = await page.evaluate(() =>
    window.localStorage.getItem('tastir.designs'),
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Quota exceeded');
    };
  });
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save a copy');
  expect(
    await page.evaluate(() => window.localStorage.getItem('tastir.designs')),
  ).toBe(before);
  await expect(page.locator('.personal-card')).toHaveCount(1);
});

test('a delayed tutorial shows its preview and real preparation stages', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    '**/assets/eight-fold-star-and-cross-*.js',
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  try {
    await page.goto(`/#/${id}/watch/3`, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /^Opening / }),
    ).toBeVisible();
    await expect(page.locator('.pattern-loading-preview')).toHaveAttribute(
      'src',
      /thumbnails/,
    );
    await expect(
      page.getByRole('list', { name: 'Preparing your pattern' }).locator('li'),
    ).toHaveCount(3);
    await expect(
      page.getByRole('link', { name: /All patterns/ }),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect(page.locator('.pattern-loading')).toHaveCount(0);
  await expect(page.locator('.step-dot[aria-current="step"]')).toHaveText('3');
});

test('drawing tools retain explanations and phone tools can be reached horizontally', async ({
  page,
}, info) => {
  await page.goto(`/#/${id}/draw`);
  const tools = page.getByRole('toolbar', { name: 'Tools', exact: true });
  const circle = tools.getByRole('button', { name: 'Circle', exact: true });
  await expect(circle).toHaveAttribute('title', /circle/i);
  await expect(circle).toHaveAttribute('aria-description', /circle/i);
  if (info.project.name === 'phone') {
    await tools.scrollIntoViewIfNeeded();
    expect(await tools.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    await tools.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(
      tools.getByRole('button', { name: 'Redo', exact: true }),
    ).toBeInViewport();
  }
});
