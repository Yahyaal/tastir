import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('filled wheel animations stay continuous through ink, repeat, and color', async ({
  page,
}) => {
  await page.goto('/#/kurt-eight-fold-zellige-filled');
  await page.locator('.journey .steps button').last().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await page.locator('.construction-guides').count()).toBe(1);
  expect(
    await page
      .locator('.el.faint')
      .evaluateAll((nodes) => nodes.flatMap((n) => n.getAnimations()).length),
  ).toBe(0);
  // The ink shows the one tile, with no tiles round it.
  await expect(page.locator('[data-next-tile]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Repeat it', exact: true }).click();
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
  // Into colour: no cover over the wall; the wall's own pieces take their
  // colour in turn, ring by ring from the middles outward.
  await expect(page.locator('svg.wall.color-enter')).toBeVisible();
  await expect(page.locator('.color-veil, svg.wall canvas')).toHaveCount(0);
  const pieces = page.locator('svg.wall pattern .wall-piece');
  const delays = await pieces.evaluateAll((nodes) =>
    nodes.map((n) => Number((n as SVGElement).dataset['delay'])),
  );
  expect(Math.min(...delays)).toBe(0);
  expect(new Set(delays).size).toBeGreaterThan(1);
  expect(
    await pieces.evaluateAll(
      (nodes) => nodes.flatMap((n) => n.getAnimations()).length,
    ),
  ).toBeGreaterThan(0);
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => a.finish()),
  );
  expect(
    await pieces.evaluateAll(
      (nodes) =>
        nodes
          .flatMap((n) => n.getAnimations())
          .filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});
