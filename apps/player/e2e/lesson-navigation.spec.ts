import { expect, test } from '@playwright/test';
const id = 'eight-fold-star-and-cross';
const position = (n: number) => new RegExp(`/${id}/watch/${n}$`);

test('manual steps enter history, Back/Forward restore in place, and reload is exact', async ({
  page,
}) => {
  await page.goto(`/#/${id}/watch/1`);
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await page
    .locator('.player')
    .evaluate((el) => el.setAttribute('data-history-retained', 'yes'));
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(position(2));
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(position(3));
  await page.goBack();
  await expect(page).toHaveURL(position(2));
  await expect(page.locator('.player')).toHaveAttribute(
    'data-history-retained',
    'yes',
  );
  await expect(page.locator('.step-dot[aria-current="step"]')).toHaveText('2');
  await page.goBack();
  await expect(page).toHaveURL(position(1));
  await page.goForward();
  await expect(page).toHaveURL(position(2));
  await page.reload();
  await expect(page.locator('.step-dot[aria-current="step"]')).toHaveText('2');
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
});

test('autoplay replaces its position without filling browser history', async ({
  page,
}) => {
  await page.goto('/#collection');
  await page.goto(`/#/${id}/watch/1`);
  const before = await page.evaluate(() => window.history.length);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page).toHaveURL(position(3), { timeout: 15000 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.evaluate(() => window.history.length)).toBe(before);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'All patterns', exact: true }),
  ).toBeVisible();
});

test('numbered links override local resume and clamp safely at the end', async ({
  page,
}) => {
  await page.addInitScript(() =>
    window.localStorage.setItem(
      'tastir.lessonAt.eight-fold-star-and-cross',
      JSON.stringify({
        index: 4,
        label: 'Step 4',
        at: new Date().toISOString(),
      }),
    ),
  );
  await page.goto(`/#/${id}/watch/3`);
  await expect(page.locator('.step-dot[aria-current="step"]')).toHaveText('3');
  await page.goto(`/#/${id}/watch/999`);
  await expect(page).toHaveURL(new RegExp(`/${id}/result$`));
});

test('a colour-first position survives reload', async ({ page }) => {
  await page.goto(`/#/${id}/watch/8?order=color`);
  await expect(page.locator('.caption .label')).toContainText('Color');
  await page.reload();
  await expect(page.locator('.caption .label')).toContainText('Color');
  await expect(page).toHaveURL(new RegExp('watch/8\\?order=color$'));
});

test('browser history wins over an unfinished reverse animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/#/${id}/watch/1`);
  await page.getByRole('button', { name: 'Go to step 2', exact: true }).click();
  await expect(page).toHaveURL(position(2));
  await page.getByRole('button', { name: 'Go to step 3', exact: true }).click();
  await expect(page).toHaveURL(position(3));
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.evaluate(() => window.history.go(-2));
  await expect(page).toHaveURL(position(1));
  await expect(page.locator('.step-dot[aria-current="step"]')).toHaveText('1');
});
