import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const id of [
  'eight-fold-star-and-cross',
  'alhambra-arrayanes-squares',
  'bou-inania-rosette',
  'bou-inania-twelve-fold-wall',
]) {
  test(`${id}: Jali has clear openings and pans and zooms`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/#/${id}/result`);
    await page
      .getByRole('combobox', { name: 'Style', exact: true })
      .selectOption('jali');
    const wall = page.locator('svg.wall.style-jali');
    await expect(wall).toBeVisible();
    await expect(wall.locator('.jali-framework path')).toHaveCount(4);
    await expect(wall.locator('polygon')).toHaveCount(0);
    await expect(wall.locator('.jali-ground')).toHaveCount(1);
    await expect(page.getByLabel('Lattice', { exact: true })).toHaveValue('1');
    await page.evaluate(() => document.fonts.ready);
    await wall.scrollIntoViewIfNeeded();
    await wall.screenshot({ path: info.outputPath(`${id}.png`) });
    if (info.project.name === 'desktop') {
      mkdirSync(resolve('docs/review/jali'), { recursive: true });
      await wall.screenshot({ path: resolve(`docs/review/jali/${id}.png`) });
    }
    const before = await wall.getAttribute('viewBox');
    await wall.hover();
    await page.mouse.wheel(0, -150);
    await expect(wall).not.toHaveAttribute('viewBox', before!);
    const zoomed = await wall.getAttribute('viewBox');
    const box = (await wall.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 40,
      box.y + box.height / 2 + 20,
    );
    await page.mouse.up();
    await expect(wall).not.toHaveAttribute('viewBox', zoomed!);
    expect(errors).toEqual([]);
  });
}

test('Jali saves, reloads, shares, previews and downloads without losing colors', async ({
  page,
  context,
}, info) => {
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page
    .getByLabel('Palette', { exact: false })
    .selectOption('Chefchaouen');
  const colors = await page
    .locator('.wall-piece')
    .evaluateAll((pieces) => pieces.map((p) => p.getAttribute('fill')));
  await page
    .getByRole('combobox', { name: 'Style', exact: true })
    .selectOption('jali');
  const lattice = page.getByLabel('Lattice', { exact: true });
  await lattice.fill('2');
  await lattice.dispatchEvent('input');
  await expect(lattice).toHaveValue('2');
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('My Jali screen');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Saved as “My Jali screen”.', { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Style', exact: true }),
  ).toHaveValue('jali');
  await expect(lattice).toHaveValue('2');
  await page.getByRole('button', { name: 'Copy a share link' }).click();
  const address = await page
    .getByRole('textbox', { name: 'Share link' })
    .inputValue();
  const other = await context.newPage();
  await other.goto(address);
  await expect(
    other.getByRole('combobox', { name: 'Style', exact: true }),
  ).toHaveValue('jali');
  await expect(other.getByLabel('Lattice', { exact: true })).toHaveValue('2');
  await other.close();

  for (const extension of ['SVG', 'PNG']) {
    const downloading = page.waitForEvent('download');
    await page
      .getByRole('button', { name: `Download ${extension}`, exact: true })
      .click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(
      `eight-fold-star-and-cross.${extension.toLowerCase()}`,
    );
    const path = info.outputPath(download.suggestedFilename());
    await download.saveAs(path);
    const data = readFileSync(path);
    if (extension === 'SVG') {
      const valid = await page.evaluate((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        return (
          !doc.querySelector('parsererror') &&
          doc.querySelectorAll('.jali-framework path').length === 4 &&
          doc.querySelectorAll('polygon').length === 0
        );
      }, data.toString());
      expect(valid).toBe(true);
    } else {
      expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(data.readUInt32BE(16)).toBeGreaterThan(0);
    }
  }

  await page
    .getByRole('combobox', { name: 'Style', exact: true })
    .selectOption('tiles');
  await expect(page.getByLabel('Palette', { exact: false })).toHaveValue(
    'Chefchaouen',
  );
  expect(
    await page
      .locator('.wall-piece')
      .evaluateAll((pieces) => pieces.map((p) => p.getAttribute('fill'))),
  ).toEqual(colors);
  // The saved screen's thumbnail still uses the saved style and width.
  await page.goto('/');
  await page
    .getByRole('button', { name: 'My designs (1)', exact: true })
    .click();
  const preview = page.locator('.thumbnail.style-jali');
  await expect(preview).toBeVisible();
  const widths = await preview
    .locator('.jali-framework path')
    .evaluateAll((paths) => paths.map((p) => p.getAttribute('stroke-width')));
  await preview.click();
  await expect(
    page.getByRole('combobox', { name: 'Style', exact: true }),
  ).toHaveValue('jali');
  await expect(lattice).toHaveValue('2');
  expect(
    await page
      .locator('.wall .jali-framework path')
      .evaluateAll((paths) => paths.map((p) => p.getAttribute('stroke-width'))),
  ).toEqual(widths);
});
