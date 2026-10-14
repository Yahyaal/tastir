import { expect, test } from '@playwright/test';

// The finished pattern opens at the top of the page with its drawing no
// taller than the screen, on every size (desktop, tablet, phone), and a
// long timeline scrolls its own row to the current step, never the page.

test('the result opens at the top, with the drawing within the screen', async ({
  page,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await expect(page.locator('.label')).toHaveText('Color');
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
  await expect(prompt).toContainText(/Choose Compass/);
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
    .getByRole('button', { name: /Compass/ });
  await expect(compass).toHaveClass(/hinted/);
  await expect(compass).toHaveAttribute('aria-pressed', 'false');
});
