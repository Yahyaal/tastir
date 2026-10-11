import { expect, test } from '@playwright/test';

for (const [id, level] of [
  ['eight-fold-khatam', 'Intermediate'],
  ['eight-fold-star-and-octagon', 'Intermediate'],
  ['ten-pointed-star-decagon-rect', 'Advanced'],
]) {
  test(`${id}: an approved study stays playable with an honest historical label`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    const card = page.locator(`.card[href="#/${id}"]`);
    await expect(card.locator('.verification-label')).toHaveText(
      'Historical match unverified',
    );
    await expect(card.locator('.level')).toHaveText(level!);
    await page.goto(`/#/${id}/result`);
    await expect(page.locator('svg.wall')).toBeVisible();
    await page.locator('.verification-note summary').click();
    await expect(page.locator('.verification-note p')).toContainText(
      /not been verified/,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: info.outputPath(`${id}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test('Darb-e Imam stays a distinct research target', async ({ page }) => {
  await page.goto('/#/upcoming');
  const target = page.locator('.upcoming-card').filter({
    has: page.getByRole('heading', {
      name: 'Darb-e Imam Decagram & Girih Tiling',
      exact: true,
    }),
  });
  await expect(target).toContainText('Figure 3');
  await expect(target).toContainText('Schematic ten-fold preview');
  await expect(target).toContainText(
    'Drawing instructions are still under research.',
  );
  await expect(target.locator('.drawing-guide-toggle')).toHaveCount(0);
});
