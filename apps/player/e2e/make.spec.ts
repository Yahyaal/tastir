import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('a finished pattern opens in 3D and downloads a 3MF for the slicer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page.getByRole('link', { name: 'Make it in 3D' }).click();
  await expect(page).toHaveURL(/#\/eight-fold-star-and-cross\/make$/);
  await expect(page.locator('.relief-view canvas')).toBeVisible();
  await expect(page.getByText('PLA if printed solid')).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Tile', exact: true }).click();
  await expect(page.getByText(/fits the 256 mm bed/)).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('');

  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download 3MF' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('eight-fold-star-and-cross-tile-100mm.3mf');
  const path = await download.path();
  if (!path) throw new Error('No download');
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
  expect(bytes.toString('latin1')).toContain('unit="millimeter"');

  // Nothing wider than the screen.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
