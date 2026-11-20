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

  // The mould for the same tile, mirrored, with its plaster.
  await page.getByRole('button', { name: 'Mould for plaster', exact: true }).click();
  await expect(page.getByText(/g of plaster/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('status')).toHaveText('');
  const mould = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download STL' }).click();
  expect((await mould).suggestedFilename()).toBe('eight-fold-star-and-cross-tile-100mm-mould.stl');

  // A panel larger than the bed, in parts: one object each in the 3MF,
  // one STL each in the zip.
  await page.getByRole('button', { name: 'The object', exact: true }).click();
  await page.getByRole('button', { name: 'Panel', exact: true }).click();
  await page.getByLabel('Width', { exact: true }).fill('400');
  await page.getByLabel('Height', { exact: true }).fill('400');
  await expect(page.getByText('4 parts', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('status')).toHaveText('');
  const parts = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download 3MF' }).click();
  const partsFile = await parts;
  expect(partsFile.suggestedFilename()).toBe('eight-fold-star-and-cross-panel-400mm-parts.3mf');
  const model = (await readFile((await partsFile.path())!)).toString('latin1');
  expect(model.match(/<object id="\d+" name="[A-B][12]"/g)).toHaveLength(4);
  const zipped = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download STLs (zip)' }).click();
  const zipFile = await zipped;
  expect(zipFile.suggestedFilename()).toBe('eight-fold-star-and-cross-panel-400mm-parts-stl.zip');
  const names = (await readFile((await zipFile.path())!)).toString('latin1').match(/panel-400mm-[AB][12]\.stl/g);
  // Each name is in the zip twice: in its entry and in the directory.
  expect(new Set(names)).toEqual(
    new Set(['A1', 'B1', 'A2', 'B2'].map((n) => `panel-400mm-${n}.stl`)),
  );

  // Stars pierced: the screen's lines, flat, as SVG and DXF.
  await page.getByRole('group', { name: 'Carving of star' }).getByRole('button', { name: 'Pierced' }).click();
  await expect(page.getByText(/Narrowest bridge of the screen/)).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('', { timeout: 20_000 });
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG' }).click();
  const svgFile = await svgDownload;
  expect(svgFile.suggestedFilename()).toBe('eight-fold-star-and-cross-panel-400mm-lines.svg');
  const drawing = (await readFile((await svgFile.path())!)).toString('utf8');
  expect(drawing).toContain('width="400mm" height="400mm"');
  expect(drawing).toContain('id="cut"');
  expect(drawing).toContain('id="engrave"');
  const dxfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download DXF' }).click();
  const lines = (await readFile((await (await dxfDownload).path())!)).toString('utf8');
  expect(lines).toMatch(/^CUT$/m);
  expect(lines).toMatch(/^ENGRAVE$/m);

  // Nothing wider than the screen.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('tile pieces download as one-colour plates and a full-size layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/eight-fold-star-and-cross/make');
  await page.getByRole('button', { name: 'Tile pieces' }).click();
  await expect(page.getByText(/\d+ pieces on \d+ plates of the 256 mm bed/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('status')).toHaveText('', { timeout: 20_000 });
  const plates = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download plates (zip)' }).click();
  const zipFile = await plates;
  expect(zipFile.suggestedFilename()).toBe('eight-fold-star-and-cross-panel-200mm-pieces-plates.zip');
  const zipped = (await readFile((await zipFile.path())!)).toString('latin1');
  const names = new Set(zipped.match(/\d\d-[a-z0-9-]+-plate-\d+-of-\d+\.3mf/g));
  const count = Number((await page.getByText(/\d+ pieces on \d+ plates/).textContent())!.match(/on (\d+) plates/)![1]);
  expect(names.size).toBe(count);
  const layout = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download layout' }).click();
  const svgFile = await layout;
  expect(svgFile.suggestedFilename()).toBe('eight-fold-star-and-cross-panel-200mm-pieces-layout.svg');
  const drawing = (await readFile((await svgFile.path())!)).toString('utf8');
  expect(drawing).toMatch(/width="210mm" height="210mm"/);
  expect(errors).toEqual([]);
});
