import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('Jali families, finishes and familiar color chooser fit the viewport', async ({
  page,
}, info) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page
    .getByRole('combobox', { name: 'Style', exact: true })
    .selectOption('jali');
  const material = page.getByRole('combobox', {
    name: 'Material',
    exact: true,
  });
  const finish = page.getByRole('combobox', { name: 'Finish', exact: true });
  for (const [family, presets] of [
    ['stone', ['limestone', 'marble', 'sandstone', 'slate']],
    ['wood', ['oak', 'walnut', 'cedar']],
    ['metal', ['silver', 'gold', 'bronze', 'copper']],
  ] as const) {
    await material.selectOption(family);
    await expect(finish.locator('option')).toHaveCount(presets.length + 1);
    for (const preset of presets) {
      await finish.selectOption(preset);
      await expect(page.locator('.wall .jali-framework')).toHaveAttribute(
        'data-finish',
        preset,
      );
      if (info.project.name === 'desktop') {
        mkdirSync(resolve('docs/review/jali'), { recursive: true });
        await page.locator('.wall').screenshot({
          path: resolve(`docs/review/jali/finish-${preset}.png`),
        });
      }
    }
  }
  for (const name of ['Framework color', 'Background color']) {
    const opener = page.getByRole('button', {
      name: `Choose ${name.toLowerCase()}`,
      exact: true,
    });
    await opener.click();
    const picker = page.getByRole('dialog', { name, exact: true });
    await expect(picker).toBeVisible();
    await expect(picker.getByRole('slider')).toHaveCount(0);
    const input = picker.locator('input[type=color]');
    await expect(input).toHaveAttribute('type', 'color');
    const bounds = (await picker.boundingBox())!;
    const anchor = (await input.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(bounds.height).toBeLessThan(250);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    // The native color opener has room to its right, including on phones.
    expect(anchor.x + 260).toBeLessThanOrEqual(viewport.width);
    await picker
      .getByRole('button', {
        name:
          name === 'Framework color' ? 'Bronze (#a77b43)' : '#234a79 (#234a79)',
        exact: true,
      })
      .click();
    await expect(input).toHaveValue(
      name === 'Framework color' ? '#a77b43' : '#234a79',
    );
    await page.keyboard.press('Escape');
    await expect(picker).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
  await finish.focus();
  await finish.selectOption('custom');
  await expect(
    page.getByRole('dialog', { name: 'Framework color' }),
  ).toBeVisible();
  mkdirSync(resolve('docs/review/jali'), { recursive: true });
  await page.screenshot({
    path: resolve(`docs/review/jali/color-chooser-${info.project.name}.png`),
  });
  await page.keyboard.press('Escape');
  await expect(finish).toBeFocused();
  await page.locator('.jali-controls').screenshot({
    path: resolve(
      `docs/review/jali/material-controls-${info.project.name}.png`,
    ),
  });
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
