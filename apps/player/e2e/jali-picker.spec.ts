import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('Jali color editors stay inside the panel and viewport', async ({
  page,
}, info) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page
    .getByRole('combobox', { name: 'Style', exact: true })
    .selectOption('jali');
  await expect(page.locator('.jali-controls input[type="color"]')).toHaveCount(
    0,
  );
  for (const name of ['Framework color', 'Background color']) {
    const opener = page.getByRole('button', {
      name: `Choose ${name.toLowerCase()}`,
      exact: true,
    });
    await opener.click();
    const picker = page.getByRole('group', {
      name: `${name} picker`,
      exact: true,
    });
    await expect(picker).toBeVisible();
    await picker.scrollIntoViewIfNeeded();
    const bounds = await picker.boundingBox();
    const controls = await page.locator('.jali-controls').boundingBox();
    const viewport = page.viewportSize()!;
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.x).toBeGreaterThanOrEqual(controls!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      controls!.x + controls!.width + 1,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
    await picker
      .getByRole('button', { name: 'Use #234a79', exact: true })
      .click();
    await expect(page.getByRole('textbox', { name, exact: true })).toHaveValue(
      '#234a79',
    );
    const red = picker.getByRole('slider', {
      name: `${name}: Red`,
      exact: true,
    });
    await red.focus();
    await red.press('Home');
    await expect(page.getByRole('textbox', { name, exact: true })).toHaveValue(
      '#004a79',
    );
    await red.press('Escape');
    await expect(picker).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
  await page
    .getByRole('button', { name: 'Choose framework color', exact: true })
    .click();
  const picker = page.getByRole('group', {
    name: 'Framework color picker',
    exact: true,
  });
  await picker.scrollIntoViewIfNeeded();
  mkdirSync(resolve('docs/review/jali'), { recursive: true });
  await page
    .locator('.jali-controls')
    .screenshot({
      path: resolve(`docs/review/jali/inline-picker-${info.project.name}.png`),
    });
});
