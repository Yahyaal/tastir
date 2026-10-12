import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('filled wheel animations stay continuous through ink, repeat, and color', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.stroke;
    const counts = { strokes: 0 };
    (window as unknown as { revealPaint: typeof counts }).revealPaint = counts;
    CanvasRenderingContext2D.prototype.stroke = function (
      this: CanvasRenderingContext2D,
      path?: Path2D,
    ) {
      counts.strokes++;
      if (path) original.call(this, path);
      else original.call(this);
    };
  });
  await page.goto('/#/kurt-eight-fold-zellige-filled');
  await page.locator('.journey .steps button').last().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await page.locator('.construction-guides').count()).toBe(1);
  expect(
    await page
      .locator('.el.faint')
      .evaluateAll((nodes) => nodes.flatMap((n) => n.getAnimations()).length),
  ).toBe(0);
  const neighbours = page.locator('[data-next-tile]');
  await expect(neighbours).toHaveCount(8);
  // CSS must not run a second opacity animation beneath the pen sequence.
  expect(
    await neighbours.first().evaluate((n) => getComputedStyle(n).animationName),
  ).toBe('none');
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => a.finish()),
  );
  expect(
    await neighbours.first().evaluate((n) => getComputedStyle(n).opacity),
  ).toBe('0.6');

  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const copy = page.locator('[data-copy="3,0"]');
  const slideStart = () =>
    copy.evaluate((node) => {
      const slide = node
        .getAnimations()
        .find((a) =>
          (a.effect as KeyframeEffect)
            .getKeyframes()
            .some((f) => 'transform' in f),
        );
      return slide?.startTime;
    });
  await expect.poll(slideStart).toEqual(expect.any(Number));
  const start = await slideStart();
  // The player's camera used to restart every copy during these frames.
  await page.waitForTimeout(700);
  expect(await slideStart()).toBe(start);

  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const canvas = page.locator('.color-veil canvas');
  await expect(canvas).toBeAttached();
  expect(await canvas.evaluate((n) => n.getAnimations().length)).toBe(1);
  // Pause on the first frame: every piece is still covered with paper and
  // ink. The canvas must align with the SVG foreignObject, not an HTML
  // text baseline several hundred screen pixels below it.
  await canvas.evaluate((n) => {
    const a = n.getAnimations()[0];
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const coverage = await canvas.evaluate((node) => {
    const c = node as HTMLCanvasElement;
    const parent = c.parentElement!.getBoundingClientRect();
    const rect = c.getBoundingClientRect();
    const pixels = c
      .getContext('2d')!
      .getImageData(0, 0, c.width, c.height).data;
    let opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 240) opaque++;
    return {
      dx: Math.abs(rect.x - parent.x),
      dy: Math.abs(rect.y - parent.y),
      covered: opaque / (c.width * c.height),
    };
  });
  expect(coverage.dx).toBeLessThan(1);
  expect(coverage.dy).toBeLessThan(1);
  expect(coverage.covered).toBeGreaterThan(0.98);
  const strokes = await page.evaluate(
    () =>
      (window as unknown as { revealPaint: { strokes: number } }).revealPaint
        .strokes,
  );
  expect(strokes).toBeGreaterThan(100);
  await canvas.evaluate((node) => {
    const a = node.getAnimations()[0];
    if (a) a.currentTime = 4000;
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const faded = await canvas.evaluate((node) => {
    const c = node as HTMLCanvasElement;
    const pixels = c
      .getContext('2d')!
      .getImageData(0, 0, c.width, c.height).data;
    let opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 240) opaque++;
    return opaque / (c.width * c.height);
  });
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { revealPaint: { strokes: number } }).revealPaint
          .strokes,
    ),
  ).toBe(strokes);
  expect(faded).toBeLessThan(coverage.covered - 0.1);
  expect(faded).toBeGreaterThan(0.05);
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => a.finish()),
  );
  await expect(canvas).toHaveCSS('opacity', '0');
  await expect
    .poll(() => canvas.evaluate((n) => (n as HTMLCanvasElement).width))
    .toBe(1);
  expect(await canvas.evaluate((n) => n.getAnimations().length)).toBe(0);
});
