/** Production browser animation benchmark. Start a Vite preview server first.
 * pnpm exec tsx tools/bench-player.mts [url] [CPU slowdown]
 * Includes script, style/layout, painting, and frame pacing, unlike engine benchmarks.
 */
import { chromium } from '@playwright/test';
const url = process.argv[2] ?? 'http://localhost:4392';
const rate = Number(process.argv[3] ?? 4);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'no-preference',
  });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate });
  await session.send('Performance.enable');
  await page.goto(`${url}/#/kurt-eight-fold-zellige-filled`);
  await page.locator('.journey').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const metrics = async () =>
    new Map(
      (await session.send('Performance.getMetrics')).metrics.map((m) => [
        m.name,
        m.value,
      ]),
    );
  async function measure(
    name: string,
    start: () => Promise<unknown>,
    duration = 3000,
  ) {
    const before = await metrics();
    await page.evaluate(() => {
      const state = {
        gaps: [] as number[],
        last: performance.now(),
        running: true,
        tick(now: number) {
          state.gaps.push(now - state.last);
          state.last = now;
          if (state.running) requestAnimationFrame(state.tick);
        },
      };
      (window as unknown as { benchFrames: typeof state }).benchFrames = state;
      requestAnimationFrame(state.tick);
    });
    await start();
    await page.waitForTimeout(duration);
    const gaps = await page.evaluate(() => {
      const state = (
        window as unknown as {
          benchFrames: { gaps: number[]; running: boolean };
        }
      ).benchFrames;
      state.running = false;
      return state.gaps;
    });
    const after = await metrics();
    gaps.sort((a, b) => a - b);
    console.log(
      JSON.stringify({
        stage: name,
        cpuSlowdown: rate,
        frames: gaps.length,
        p95FrameMs: Math.round(gaps[Math.floor(gaps.length * 0.95)] ?? 0),
        maxFrameMs: Math.round(gaps.at(-1) ?? 0),
        ...Object.fromEntries(
          [
            'TaskDuration',
            'ScriptDuration',
            'LayoutDuration',
            'RecalcStyleDuration',
          ].map((k) => [
            k + 'Ms',
            Math.round(((after.get(k) ?? 0) - (before.get(k) ?? 0)) * 1000),
          ]),
        ),
      }),
    );
  }
  await page.locator('.journey .steps button').last().click();
  await measure('ink', () =>
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  );
  await measure('repeat', () =>
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  );
  await measure('color', () =>
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  );
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => a.finish()),
  );
  await measure(
    'wall pan/zoom',
    async () => {
      const wall = page.locator('svg.wall');
      const box = await wall.boundingBox();
      if (!box) throw new Error('Wall is missing');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, i % 2 ? 60 : -60);
        await page.waitForTimeout(20);
      }
    },
    100,
  );
} finally {
  await browser.close();
}
