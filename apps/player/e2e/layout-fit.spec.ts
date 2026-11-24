import { expect, test } from '@playwright/test';

// The finished pattern opens at the top of the page with its drawing no
// taller than the screen, on every size (desktop, tablet, phone), and a
// long timeline scrolls its own row to the current step, never the page.

test('the result opens at the top, with the drawing within the screen', async ({
  page,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await expect(page.locator('.make-panel')).toBeVisible();
  const fit = await page.evaluate(() => ({
    scroll: window.scrollY,
    stage: document.querySelector('.stage')?.getBoundingClientRect().height,
    screen: window.innerHeight,
  }));
  expect(fit.scroll).toBe(0);
  expect(fit.stage).toBeGreaterThan(100);
  expect(fit.stage).toBeLessThanOrEqual(fit.screen);
});

test('going to a late step scrolls the timeline, not the page', async ({
  page,
}) => {
  await page.goto('/#/bou-inania-rosette/watch');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Go to step 20' }).click();
  await expect(
    page.getByRole('button', { name: 'Go to step 20' }),
  ).toHaveAttribute('aria-current', 'step');
  // On a phone the timeline sits above the drawing, so the page may hold
  // still at the top; elsewhere it must not move at all.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.getByRole('button', { name: 'Go to step 20' }),
  ).toBeInViewport();
});

test('draw along says what to tap in view, beside the board', async ({
  page,
}, info) => {
  await page.goto('/#/eight-fold-star-and-cross/draw');
  const prompt = page.locator('.along-board-caption .instruction');
  await expect(prompt).toContainText(/Choose Circle/);
  await expect(prompt).toBeInViewport();
  // On a phone the prompt sits above the fixed Back and Next bar.
  if (info.project.name === 'phone') {
    const said = await prompt.boundingBox();
    const bar = await page.locator('.along-nav').boundingBox();
    expect(said!.y + said!.height).toBeLessThanOrEqual(bar!.y);
  }
  // The suggested tool is marked, but not chosen.
  const compass = page
    .getByRole('toolbar', { name: 'Tools' })
    .getByRole('button', { name: /Circle$/ });
  await expect(compass).toHaveClass(/hinted/);
  await expect(compass).toHaveAttribute('aria-pressed', 'false');
});

test('on a phone a first visit finds Make it yours folded, and it stays as left', async ({
  browser,
}, info) => {
  test.skip(info.project.name !== 'phone', 'The slim bar is for phones.');
  const context = await browser.newContext({
    baseURL: info.project.use.baseURL,
    // A first visit: nothing kept (the project opens Make it yours).
    storageState: { cookies: [], origins: [] },
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/#/eight-fold-star-and-cross/result');
    const panel = page.getByRole('complementary', { name: 'Make it yours' });
    await expect(panel).toBeVisible();
    // Folded: the foot, no colours, and most of the screen for the wall.
    await expect(panel.getByRole('tab', { name: 'Look' })).toBeHidden();
    await expect(
      panel.getByRole('button', { name: 'Share', exact: true }),
    ).toBeVisible();
    const box = await panel.boundingBox();
    expect(box!.height).toBeLessThan(200);
    await panel
      .getByRole('button', { name: 'Make it yours', exact: true })
      .click();
    await expect(panel.getByRole('tab', { name: 'Look' })).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole('complementary', { name: 'Make it yours' })
        .getByRole('tab', { name: 'Look' }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
