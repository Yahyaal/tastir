import { expect, test } from '@playwright/test';

for (const stage of ['/watch', '/result']) {
  test(`two-finger zoom preserves its anchor and supports panning: ${stage || 'construction'}`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== 'phone',
      'Touch regression uses the phone viewport.',
    );
    await page.goto(`/#/eight-fold-star-and-cross${stage}`);
    const svg = page.locator('svg.drawing').first();
    await svg.waitFor();
    if (stage === '/watch') {
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await expect(svg).not.toHaveClass(/wall/);
    } else await expect(svg).toHaveClass(/wall/);
    await svg.scrollIntoViewIfNeeded();
    const bounds = await svg.boundingBox();
    if (!bounds) throw new Error('No drawing bounds');
    const x = bounds.x + bounds.width * 0.6;
    const y = Math.max(
      bounds.y + 30,
      Math.min(bounds.y + bounds.height * 0.4, 750),
    );
    const session = await page.context().newCDPSession(page);
    const state = () =>
      svg.evaluate(
        (node, screen) => {
          const root = node as SVGSVGElement;
          const point = root.createSVGPoint();
          point.x = screen.x;
          point.y = screen.y;
          const matrix = root.getScreenCTM();
          if (!matrix) throw new Error('No SVG matrix');
          const at = point.matrixTransform(matrix.inverse());
          return { width: root.viewBox.baseVal.width, x: at.x, y: at.y };
        },
        { x, y },
      );
    const before = await state();
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x - 35, y, id: 1 },
        { x: x + 35, y, id: 2 },
      ],
    });
    for (let d = 40; d <= 70; d += 5)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: x - d, y, id: 1 },
          { x: x + d, y, id: 2 },
        ],
      });
    await expect
      .poll(async () => (await state()).width)
      .toBeCloseTo(before.width / 2, 3);
    const after = await state();
    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
    for (let d = 65; d >= 35; d -= 5)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: x - d, y, id: 1 },
          { x: x + d, y, id: 2 },
        ],
      });
    await expect
      .poll(async () => (await state()).width)
      .toBeCloseTo(before.width, 3);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x - 15, y, id: 1 },
        { x: x + 55, y, id: 2 },
      ],
    });
    await expect.poll(async () => (await state()).x).toBeLessThan(before.x);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const released = await state();
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 3 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 25, y, id: 3 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect.poll(async () => (await state()).x).toBeLessThan(released.x);
    expect((await state()).width).toBeCloseTo(released.width, 3);
    await session.detach();
  });
}
