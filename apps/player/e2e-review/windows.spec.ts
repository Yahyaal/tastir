import { expect, test } from '@playwright/test';

// REDESIGN.1's acceptance test: the review page shows a window of every
// arch in light and in dark, and keyboard focus reveals its buttons.
const ARCHES = [
  'round',
  'horseshoe',
  'lambrequin',
  'pointed-horseshoe',
  'polylobed',
  'keel',
  'ottoman',
  'persian',
  'pishtaq',
  'cusped',
];

test('every arch in light and dark, and focus reveals the buttons', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/review/windows');
  await expect(
    page.getByRole('heading', { name: 'Window cards', exact: true }),
  ).toBeVisible();
  for (const theme of ['light', 'dark']) {
    const panel = page.locator(`.windows-review-panel[data-theme="${theme}"]`);
    const arches = await panel
      .locator('.window')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-arch')));
    expect(arches).toEqual(ARCHES);
    // Each picture is clipped to its own arch, and every picture loads.
    for (const arch of ARCHES) {
      const pic = panel.locator(`.window[data-arch="${arch}"] .window-pic`);
      expect(await pic.evaluate((el) => getComputedStyle(el).clipPath)).toBe(
        `url("#tastir-arch-${arch}")`,
      );
      await pic.locator('img').scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          pic.locator('img').evaluate((img: HTMLImageElement) => {
            return img.complete && img.naturalWidth > 0;
          }),
        )
        .toBe(true);
    }
  }
  // The dark panel really is dark: its ground differs from the light one.
  const grounds = await page
    .locator('.windows-review-panel')
    .evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).backgroundColor),
    );
  expect(grounds[0]).not.toBe(grounds[1]);

  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: info.outputPath('windows.png'),
    fullPage: true,
  });

  // Tab onto the first window: View takes focus and all three buttons show.
  const first = page.locator('.windows-review-panel .window').first();
  const actions = first.locator('.window-actions');
  await expect(actions).toHaveCSS('opacity', '0');
  await page.locator('.review-top a').last().focus();
  await page.keyboard.press('Tab');
  const view = first.getByRole('link', { name: /^View / });
  await expect(view).toBeFocused();
  await expect(actions).toHaveCSS('opacity', '1');
  await expect(view).toHaveAttribute('href', /^#\/[^/]+$/);
  await expect(
    first.locator('.window-actions').getByRole('link', {
      name: 'Watch it drawn',
    }),
  ).toHaveAttribute('href', /\/watch$/);
  await page.keyboard.press('Tab');
  await expect(
    first.locator('.window-actions').getByRole('link', {
      name: 'Watch it drawn',
    }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  const draw = first
    .locator('.window-actions')
    .getByRole('link', { name: 'Draw along' });
  await expect(draw).toBeFocused();
  await expect(draw).toHaveAttribute('href', /\/draw$/);
  await expect(actions).toHaveCSS('opacity', '1');
  await first.screenshot({ path: info.outputPath('focus.png') });

  // On a phone the two other actions are icons beside the title; with a
  // mouse they are not there.
  const touch = first.locator('.window-touch');
  if (info.project.name === 'phone') await expect(touch).toBeVisible();
  else await expect(touch).toBeHidden();
  expect(errors).toEqual([]);
});

test('a click on the picture opens the wall', async ({ page }) => {
  await page.goto('/#/review/windows');
  const first = page.locator('.windows-review-panel .window').first();
  const href = await first
    .locator('.window-actions .view')
    .getAttribute('href');
  await first.locator('.window-pic').click({ position: { x: 60, y: 60 } });
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator('svg.wall')).toBeVisible();
});
