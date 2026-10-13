import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('pattern cards open the result and original when available', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.card[href="#/minbar-doors-cairo"]').click();
  await expect(page.locator('.label')).toHaveText('Color');
  await expect(
    page.getByRole('figure', { name: 'The original' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Replay', exact: true }),
  ).toBeVisible();
});

test('watch autoplays, freezes on pause, resumes, and allows stepping', async ({
  page,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/watch');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedLabel = await page.locator('.label').textContent();
  const times = () =>
    page.locator('.plate-area').evaluate((node) =>
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'paused')
        .map((animation) => animation.currentTime),
    );
  const pausedTimes = await times();
  expect(pausedTimes.length).toBeGreaterThan(0);
  await page.waitForTimeout(2200);
  await expect(page.locator('.label')).toHaveText(pausedLabel!);
  expect(await times()).toEqual(pausedTimes);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.label')).not.toHaveText(pausedLabel!);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Go to step 2', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.label')).toHaveText('Step 3 of 6');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('.label')).toHaveText('Step 2 of 6');
  await page.waitForTimeout(2200);
  await expect(page.locator('.label')).toHaveText('Step 2 of 6');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
});
