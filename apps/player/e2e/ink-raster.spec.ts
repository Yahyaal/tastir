import { expect, test } from '@playwright/test';

test('dense ink backgrounds follow zoom, resize, and inherited colors', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/kurt-eight-fold-zellige-shifted/draw');
  const status = page.locator('.along-check[role="status"]');
  const steps = page.locator('.along-steps button[aria-label^="Step "]');
  await expect(steps.first()).toBeVisible();
  for (let i = 0; i < (await steps.count()); i++) {
    await steps.nth(i).click();
    await expect(status).not.toContainText('Checking');
    const draw = page.getByRole('button', {
      name: 'Draw it for me',
      exact: true,
    });
    if (await draw.isEnabled()) await draw.click();
    await expect(status).not.toContainText('Checking');
  }
  await page.getByRole('button', { name: 'Ink', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Ink it for me', exact: true }),
  ).toBeEnabled();
  const layers = page.locator('.editor-drawing foreignObject canvas');
  await expect(layers).toHaveCount(2);
  const dots = layers.last();
  const pixels = () =>
    dots.evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  const before = await pixels();
  await page.locator('.editor-drawing').hover();
  await page.mouse.wheel(0, -240);
  await expect.poll(pixels).not.toBe(before);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect
    .poll(() =>
      dots.evaluate((el) => {
        const canvas = el as HTMLCanvasElement;
        return Math.abs(
          canvas.width -
            canvas.getBoundingClientRect().width * devicePixelRatio,
        );
      }),
    )
    .toBeLessThanOrEqual(1);
  await page.evaluate(() =>
    document.documentElement.style.setProperty('--muted', 'rgb(255, 0, 0)'),
  );
  await expect
    .poll(() =>
      dots.evaluate((el) => {
        const canvas = el as HTMLCanvasElement;
        const data = canvas
          .getContext('2d')!
          .getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 0; i < data.length; i += 4)
          if (data[i + 3] === 255) return [data[i], data[i + 1], data[i + 2]];
        return [];
      }),
    )
    .toEqual([255, 0, 0]);
  await page.evaluate(() =>
    document.documentElement.style.removeProperty('--muted'),
  );
  expect(errors).toEqual([]);
});
