import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function setColor(page: Page, label: string, color: string) {
  await page.getByLabel(label, { exact: true }).evaluate((node, value) => {
    const input = node as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, color);
}
async function expectColor(page: Page, label: string, color: string) {
  await expect(page.getByLabel(label, { exact: true })).toHaveValue(color);
}

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
      .getByRole('group', { name: 'Style', exact: true })
      .getByRole('button', { name: 'Jali', exact: true })
      .click();
    const wall = page.locator('svg.wall.style-jali');
    await expect(wall).toBeVisible();
    await expect(wall.locator('.jali-framework > path')).toHaveCount(5);
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
    for (const finish of ['wood', 'metal', 'stone']) {
      await page
        .getByRole('button', {
          name:
            finish === 'wood' ? 'Wood' : finish === 'metal' ? 'Metal' : 'Stone',
          exact: true,
        })
        .click();
      await expect(wall.locator('.jali-framework')).toHaveAttribute(
        'data-material',
        finish,
      );
      await expect(wall.locator('.jali-framework > path')).toHaveCount(
        finish === 'wood' ? 7 : finish === 'stone' ? 5 : 6,
      );
      await expect(wall.locator('polygon, filter')).toHaveCount(0);
      await expectColor(page, 'Background color', '#708d87');
      if (info.project.name === 'desktop') {
        await wall.screenshot({
          path: resolve(`docs/review/jali/${id}-${finish}.png`),
        });
      }
    }
    await setColor(page, 'Framework color', '#864b31');
    const strokes = await wall
      .locator('.jali-framework > path')
      .evaluateAll((paths) => paths.map((p) => p.getAttribute('stroke')));
    await setColor(page, 'Background color', '#234a79');
    expect(
      await wall
        .locator('.jali-framework > path')
        .evaluateAll((paths) => paths.map((p) => p.getAttribute('stroke'))),
    ).toEqual(strokes);
    await expect(wall.locator('stop[offset="48%"]')).toHaveAttribute(
      'stop-color',
      '#234a79',
    );
    await page
      .getByRole('button', { name: 'Reset Jali finish', exact: true })
      .click();
    await expectColor(page, 'Framework color', '#e6dcc7');
    await expectColor(page, 'Background color', '#708d87');
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
    .getByRole('group', { name: 'Palette' })
    .getByRole('button', { name: 'Chefchaouen', exact: true })
    .click();
  const colors = await page
    .locator('.wall-piece')
    .evaluateAll((pieces) => pieces.map((p) => p.getAttribute('fill')));
  await page
    .getByRole('group', { name: 'Style', exact: true })
    .getByRole('button', { name: 'Jali', exact: true })
    .click();
  await page.getByRole('button', { name: 'Wood', exact: true }).click();
  await setColor(page, 'Framework color', '#864b31');
  await setColor(page, 'Background color', '#234a79');
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
    page
      .getByRole('group', { name: 'Style', exact: true })
      .getByRole('button', { name: 'Jali', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(lattice).toHaveValue('2');
  await expect(
    page.getByRole('button', { name: 'Wood', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expectColor(page, 'Framework color', '#864b31');
  await expectColor(page, 'Background color', '#234a79');
  // Finish edits participate in the saved-design dirty state.
  await page.getByRole('button', { name: 'Metal', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Save', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Wood', exact: true }).click();
  await setColor(page, 'Framework color', '#864b31');
  await expect(
    page.getByRole('button', { name: 'Saved', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Copy a share link' }).click();
  const address = await page
    .getByRole('textbox', { name: 'Share link' })
    .inputValue();
  const other = await context.newPage();
  await other.goto(address);
  await expect(
    other
      .getByRole('group', { name: 'Style', exact: true })
      .getByRole('button', { name: 'Jali', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(other.getByLabel('Lattice', { exact: true })).toHaveValue('2');
  await expect(
    other.getByRole('button', { name: 'Wood', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expectColor(other, 'Framework color', '#864b31');
  await expectColor(other, 'Background color', '#234a79');
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
          doc.querySelectorAll('.jali-framework > path').length === 7 &&
          doc
            .querySelector('.jali-framework')
            ?.getAttribute('data-material') === 'wood' &&
          doc.querySelector('[data-layer="wood"]')?.getAttribute('stroke') ===
            '#864b31' &&
          doc
            .querySelector('stop[offset="48%"]')
            ?.getAttribute('stop-color') === '#234a79' &&
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
    .getByRole('group', { name: 'Style', exact: true })
    .getByRole('button', { name: 'Tiles', exact: true })
    .click();
  await expect(
    page
      .getByRole('group', { name: 'Palette' })
      .getByRole('button', { name: 'Chefchaouen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page
      .locator('.wall-piece')
      .evaluateAll((pieces) => pieces.map((p) => p.getAttribute('fill'))),
  ).toEqual(colors);
  // The saved screen's thumbnail still uses the saved style and width.
  await page.goto('/');
  await page.getByRole('link', { name: 'Your work (1)', exact: true }).click();
  const preview = page.locator('.thumbnail.style-jali');
  await expect(preview).toBeVisible();
  await expect(preview.locator('.jali-framework')).toHaveAttribute(
    'data-material',
    'wood',
  );
  await expect(preview.locator('[data-layer="wood"]')).toHaveAttribute(
    'stroke',
    '#864b31',
  );
  await expect(preview.locator('stop[offset="48%"]')).toHaveAttribute(
    'stop-color',
    '#234a79',
  );
  const widths = await preview
    .locator('.jali-framework > path')
    .evaluateAll((paths) => paths.map((p) => p.getAttribute('stroke-width')));
  await preview.click();
  await expect(
    page
      .getByRole('group', { name: 'Style', exact: true })
      .getByRole('button', { name: 'Jali', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(lattice).toHaveValue('2');
  expect(
    await page
      .locator('.wall .jali-framework > path')
      .evaluateAll((paths) => paths.map((p) => p.getAttribute('stroke-width'))),
  ).toEqual(widths);
  // Reset must also replace the saved finish if another style is active at save time.
  await page
    .getByRole('button', { name: 'Reset Jali finish', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Style', exact: true })
    .getByRole('button', { name: 'Tiles', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await page
    .getByRole('group', { name: 'Style', exact: true })
    .getByRole('button', { name: 'Jali', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Stone', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expectColor(page, 'Framework color', '#e6dcc7');
  await expectColor(page, 'Background color', '#708d87');
});
