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
