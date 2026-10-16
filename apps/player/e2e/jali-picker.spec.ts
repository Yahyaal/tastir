import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('Jali materials, finish swatches and custom colors need no dropdown or modal', async ({
  page,
}, info) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page
    .getByRole('group', { name: 'Style', exact: true })
    .getByRole('button', { name: 'Jali', exact: true })
    .click();
  const controls = page.locator('.jali-controls');
  await expect(controls.getByRole('combobox')).toHaveCount(0);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await controls
    .getByRole('button', { name: 'Custom framework color', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(
    controls.getByLabel('Framework color', { exact: true }),
  ).toHaveValue('#e6dcc7');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.evaluate(() => {
    // Observe the native picker request without opening an OS-owned popup.
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      value(this: HTMLInputElement) {
        this.dataset['pickerCalls'] = String(
          Number(this.dataset['pickerCalls'] ?? 0) + 1,
        );
      },
    });
  });
  for (const [family, presets] of [
    ['Stone', ['Limestone', 'Marble', 'Sandstone', 'Slate']],
    ['Wood', ['Oak', 'Walnut', 'Cedar']],
    ['Metal', ['Silver', 'Gold', 'Bronze', 'Copper']],
  ] as const) {
    await controls.getByRole('button', { name: family, exact: true }).click();
    const finishes = controls.getByRole('group', {
      name: 'Framework finishes',
    });
    await expect(finishes.getByRole('button')).toHaveText([...presets]);
    for (const preset of presets) {
      const button = finishes.getByRole('button', {
        name: preset,
        exact: true,
      });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.wall .jali-framework')).toHaveAttribute(
        'data-finish',
        preset.toLowerCase(),
      );
      if (info.project.name === 'desktop') {
        mkdirSync(resolve('docs/review/jali'), { recursive: true });
        await page.locator('.wall').screenshot({
          path: resolve(`docs/review/jali/finish-${preset.toLowerCase()}.png`),
        });
      }
    }
    await controls.scrollIntoViewIfNeeded();
    mkdirSync(resolve('docs/review/jali'), { recursive: true });
    await controls.screenshot({
      path: resolve(
        `docs/review/jali/direct-${family.toLowerCase()}-${info.project.name}.png`,
      ),
    });
  }
  for (const label of ['Framework color', 'Background color']) {
    const input = controls.getByLabel(label, { exact: true });
    const button = controls.getByRole('button', {
      name: `Custom ${label.toLowerCase()}`,
      exact: true,
    });
    await button.click();
    await expect(input).toHaveAttribute('data-picker-calls', '1');
    await button.press('Enter');
    await expect(input).toHaveAttribute('data-picker-calls', '2');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(button).toBeFocused();
    const anchor = (await input.boundingBox())!;
    expect(anchor.x).toBeGreaterThanOrEqual(0);
    expect(anchor.x + 260).toBeLessThanOrEqual(page.viewportSize()!.width);
    await input.evaluate((node) => {
      const el = node as HTMLInputElement;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(el, '#864b31');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(page.locator('.wall .jali-framework')).toHaveAttribute(
    'data-material',
    'metal',
  );
  await expect(page.locator('.wall .jali-framework')).toHaveAttribute(
    'data-finish',
    'custom',
  );
  await controls
    .getByRole('button', { name: 'Night blue background', exact: true })
    .click();
  await expect(page.locator('.wall stop[offset="48%"]')).toHaveAttribute(
    'stop-color',
    '#234a79',
  );
  await expect(page.locator('.wall [data-layer="metal"]')).toHaveAttribute(
    'stroke',
    '#864b31',
  );
  const viewport = page.viewportSize()!;
  const bounds = (await controls.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(viewport.width);
});
