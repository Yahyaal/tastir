import { expect, test, type Page } from '@playwright/test';

async function settings(page: Page) {
  await page.getByLabel('Settings', { exact: true }).click();
}
async function copyLink(page: Page) {
  await page
    .getByRole('button', { name: 'Copy a share link', exact: true })
    .click();
  return page
    .getByRole('textbox', { name: 'Share link', exact: true })
    .inputValue();
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Use the in-page link in this test.');
        },
      },
    }),
  );
});
test('visible settings choices keep keyboard navigation inside the setting and preserve the final reveal', async ({
  page,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/watch');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await settings(page);
  await expect(page.locator('.settings-theme-choice')).toHaveCount(0);
  await expect(
    page.getByRole('radio', { name: 'Guide first', exact: true }),
  ).toBeChecked();
  await expect(page.locator('.settings-panel select')).toHaveCount(0);
  await expect(page.getByRole('switch')).toHaveCount(3);
  await page.getByRole('radio', { name: '1×', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('radio', { name: '2×', exact: true }),
  ).toBeChecked();
  await expect(page.locator('.label')).toHaveText('Step 1 of 6');
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Settings', { exact: true })).toBeFocused();
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.destination-guide')).toHaveCount(1);
  await expect(page.locator('.so-far')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.destination-guide')).toHaveCount(0);
  await expect(page.locator('.ink [data-ink]').first()).toBeVisible();
});
test('a lesson link restores the exact step and overrides settings without replacing recipient preferences', async ({
  page,
  browser,
}, info) => {
  await page.goto('/#/eight-fold-star-and-cross/watch');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await settings(page);
  await page.getByRole('radio', { name: '2×', exact: true }).check();
  await page.getByRole('switch', { name: 'Show names', exact: true }).check();
  await page
    .getByRole('switch', { name: 'Show helper lines', exact: true })
    .check();
  await page.keyboard.press('Escape');
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  const view = await page.locator('svg.drawing').getAttribute('viewBox');
  const link = await copyLink(page);
  const other = await browser.newContext({
    viewport: page.viewportSize() ?? { width: 1280, height: 800 },
    reducedMotion: 'reduce',
    isMobile: info.project.name === 'phone',
    hasTouch: info.project.name === 'phone',
  });
  await other.addInitScript(() => {
    localStorage.setItem('tastir.showNames', 'false');
    localStorage.setItem('tastir.showHelpers', 'false');
    localStorage.setItem('tastir.inkMode.v2', '"end"');
  });
  try {
    const recipient = await other.newPage();
    await recipient.goto(link);
    await expect(recipient.locator('.destination-guide')).toHaveCount(1);
    await expect(recipient.locator('svg.drawing')).toHaveAttribute(
      'viewBox',
      view ?? '',
    );
    await expect(
      recipient.getByRole('button', { name: 'Pause', exact: true }),
    ).toHaveCount(0);
    await settings(recipient);
    await expect(
      recipient.getByRole('radio', { name: '2×', exact: true }),
    ).toBeChecked();
    await expect(
      recipient.getByRole('switch', { name: 'Show names', exact: true }),
    ).toBeChecked();
    await expect(
      recipient.getByRole('switch', { name: 'Show helper lines', exact: true }),
    ).toBeChecked();
    expect(
      await recipient.evaluate(() => localStorage.getItem('tastir.showNames')),
    ).toBe('false');
    expect(
      await recipient.evaluate(() => localStorage.getItem('tastir.inkMode.v2')),
    ).toBe('"end"');
  } finally {
    await other.close();
  }
});
test('a wall link restores palette, watercolour and zoom in a clean browser', async ({
  page,
  browser,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page
    .getByRole('group', { name: 'Style', exact: true })
    .getByRole('button', { name: 'Watercolour', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Teal and gold', exact: true })
    .click();
  const wall = page.locator('svg.wall');
  await wall.scrollIntoViewIfNeeded();
  await wall.hover();
  await page.mouse.wheel(0, -200);
  await expect
    .poll(async () =>
      Number(((await wall.getAttribute('viewBox')) ?? '').split(' ')[2]),
    )
    .toBeLessThan(12);
  const view = await wall.getAttribute('viewBox'),
    link = await copyLink(page);
  const other = await browser.newContext({
    viewport: page.viewportSize() ?? { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  try {
    const recipient = await other.newPage();
    await recipient.goto(link);
    await expect(recipient.locator('svg.wall')).toHaveClass(/style-lines/);
    await expect(recipient.locator('svg.wall')).toHaveAttribute(
      'viewBox',
      view ?? '',
    );
    await expect(
      recipient.getByRole('button', { name: 'Teal and gold', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(recipient.locator('svg.wall g.wash')).toHaveCount(1);
  } finally {
    await other.close();
  }
});

for (const legacy of [
  'classic',
  'atelier',
  'precision',
  'mosaic',
  'lagoon',
  'ribbon',
  'inlay',
]) {
  test(`saved ${legacy} preference opens the final Outline panel`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) =>
        localStorage.setItem('tastir.settingsDesign', JSON.stringify(value)),
      legacy,
    );
    await page.goto('/#/eight-fold-star-and-cross/result');
    await settings(page);
    await expect(page.locator('.settings-panel')).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Panel theme', exact: true }),
    ).toHaveCount(0);
    await page.reload();
    await settings(page);
    await expect(page.locator('.settings-panel')).toBeVisible();
    await page.getByRole('radio', { name: '1×', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('radio', { name: '2×', exact: true }),
    ).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Settings', { exact: true })).toBeFocused();
  });
}
