import { expect, test } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const FINISHES = [
  ['Stone', 'Limestone', 'limestone-grain'],
  ['Stone', 'Marble', 'marble-veins'],
  ['Stone', 'Sandstone', 'sandstone-grain'],
  ['Stone', 'Slate', 'slate-strata'],
  ['Wood', 'Oak', 'oak-grain'],
  ['Wood', 'Walnut', 'walnut-grain'],
  ['Wood', 'Cedar', 'cedar-grain'],
  ['Metal', 'Silver', 'brushed-metal'],
  ['Metal', 'Gold', 'brushed-metal'],
  ['Metal', 'Bronze', 'bronze-hammered'],
  ['Metal', 'Copper', 'copper-hammered'],
] as const;
const folder = resolve('docs/review/jali/textures');

for (const id of ['eight-fold-star-and-cross', 'bou-inania-rosette']) {
  test(`${id}: textured finishes stay open and produce normal and detail screenshots`, async ({
    page,
  }, info) => {
    mkdirSync(folder, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/#/${id}/result`);
    await page
      .getByRole('group', { name: 'Style', exact: true })
      .getByRole('button', { name: 'Jali', exact: true })
      .click();
    const wall = page.locator('svg.wall');
    await expect(wall).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const original = await wall.getAttribute('viewBox');
    for (const [family, finish, texture] of FINISHES) {
      if (
        id === 'bou-inania-rosette' &&
        !['Marble', 'Sandstone', 'Oak', 'Bronze'].includes(finish)
      )
        continue;
      await page.getByRole('button', { name: family, exact: true }).click();
      await page.getByRole('button', { name: finish, exact: true }).click();
      await expect(wall.locator('pattern[data-texture]')).toHaveAttribute(
        'data-texture',
        texture,
      );
      await expect(wall.locator('filter, mask, polygon')).toHaveCount(0);
      await expect(wall.locator('[data-layer="texture"]')).toHaveCount(1);
      await expect(
        page
          .getByRole('button', { name: finish, exact: true })
          .locator('svg pattern'),
      ).toHaveAttribute('data-texture', texture);
      const marks = await wall.locator('pattern[data-texture] > *').count();
      expect(marks).toBeLessThanOrEqual(64);
      const stem = `${id}-${finish.toLowerCase()}-${info.project.name}`;
      if (
        info.project.name === 'desktop' &&
        id === 'eight-fold-star-and-cross'
      ) {
        const baseline = resolve(
          `docs/review/jali/finish-${finish.toLowerCase()}.png`,
        );
        const preserved = resolve(folder, `before-${finish.toLowerCase()}.png`);
        if (existsSync(baseline) && !existsSync(preserved))
          copyFileSync(baseline, preserved);
      }
      await wall.scrollIntoViewIfNeeded();
      await wall.screenshot({ path: resolve(folder, `${stem}.png`) });
      const before = await wall.getAttribute('viewBox');
      await wall.hover();
      await page.mouse.wheel(0, -550);
      await expect(wall).not.toHaveAttribute('viewBox', before!);
      await wall.screenshot({ path: resolve(folder, `${stem}-detail.png`) });
      await wall.hover();
      await page.mouse.wheel(0, 550);
      await expect
        .poll(async () => {
          const restored = (await wall.getAttribute('viewBox'))!
            .split(' ')
            .map(Number);
          return Math.max(
            ...original!
              .split(' ')
              .map(Number)
              .map((value, i) => Math.abs(value - restored[i]!)),
          );
        })
        .toBeLessThan(1e-5);
    }
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
}
