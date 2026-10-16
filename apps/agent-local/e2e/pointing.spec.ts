import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '@tastir/agent-protocol';

const runId = '55c4c0a2-487f-4c25-a25d-79518ef86021';
async function connected(page: Page) {
  await page.route('**/__agent/status', (r) =>
    r.fulfill({
      json: {
        profiles: [{ id: 'mock', label: 'Simulated account', connected: true }],
        activeId: 'mock',
        connected: true,
        sharing: true,
        signingIn: false,
        error: null,
      },
    }),
  );
  await page.route('**/__agent/models', (r) =>
    r.fulfill({ json: [{ slug: 'mock', name: 'Simulated model' }] }),
  );
  await page.route('**/__agent/turn/cancel', (r) => r.fulfill({ json: {} }));
}
async function editor(page: Page) {
  await page.goto('/#/');
  const id = await page.evaluate(async () => {
    // eslint-disable-next-line @nx/enforce-module-boundaries -- Browser-side Vite URL.
    const { addPattern } = await import('/src/editor/patterns.ts');
    // eslint-disable-next-line @nx/enforce-module-boundaries -- Browser-side Vite URL.
    const { LIBRARY } = await import('/src/app/library.ts');
    const entry = LIBRARY.find(
      (e: { id: string }) => e.id === 'eight-fold-star-and-octagon',
    );
    const json =
      typeof entry.json === 'function' ? await entry.json() : entry.json;
    return addPattern({ ...json, title: 'Pointing test pattern' }).id;
  });
  await page.goto(`/#/edit/${id}`);
}
async function open(page: Page) {
  const board = page.locator('[data-tastir-page] svg.drawing').first();
  await board.waitFor();
  await board.evaluate((svg) =>
    window.scrollBy(0, svg.getBoundingClientRect().top - 70),
  );
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Send current view' }),
  ).toBeEnabled();
}
async function ask(page: Page) {
  await page
    .getByRole('textbox', { name: 'Your request' })
    .fill('Point at a visible object.');
  await page.getByRole('button', { name: 'Send current view' }).click();
}
const highlight = (snapshot: Snapshot, id: string) => ({
  id: 'point',
  name: 'highlight_target',
  arguments: {
    snapshotId: snapshot.id,
    targetId: id,
    label: 'Here is the requested object',
  },
});

test('points at real editor geometry, follows zoom and scroll, and clears when its drawing changes', async ({
  page,
}) => {
  await connected(page);
  let chosen: Snapshot['targets'][number];
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s } = r.request().postDataJSON() as {
      snapshot: Snapshot;
    };
    expect(s.mode).toBe('screen');
    expect(s.image).toMatch(/^data:image\/png;base64,/);
    chosen = s.targets.find((t) => t.kind === 'point')!;
    expect(chosen).toBeDefined();
    expect(s.targets.some((t) => t.kind === 'control')).toBe(true);
    await r.fulfill({
      json: { runId, text: '', calls: [highlight(s, chosen.id)] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    expect(r.request().postDataJSON().results[0]).toMatchObject({ ok: true });
    await expect(
      page.locator('[data-screen-pointer] [data-pointer-shape]'),
    ).toBeVisible();
    await r.fulfill({ json: { runId, text: 'Point displayed.', calls: [] } });
  });
  await editor(page);
  await open(page);
  await ask(page);
  await expect(page.locator('.agent-answer')).toHaveText('Point displayed.');
  const aligned = async () =>
    page.evaluate(
      (g) => {
        const svg = document.querySelector(
          '[data-tastir-page] svg.drawing',
        ) as SVGSVGElement;
        const ring = document.querySelector(
          '[data-screen-pointer] circle',
        ) as SVGCircleElement;
        if (!ring) return false;
        const point = new DOMPoint(g.at.x, -g.at.y).matrixTransform(
          svg.getScreenCTM()!,
        );
        const b = ring.getBoundingClientRect();
        return (
          Math.abs(point.x - b.x - b.width / 2) < 1 &&
          Math.abs(point.y - b.y - b.height / 2) < 1
        );
      },
      chosen!.geometry as { at: { x: number; y: number } },
    );
  await expect.poll(aligned).toBe(true);
  const board = page.locator('[data-tastir-page] svg.drawing').first();
  const b = (await board.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, Math.min(b.y + b.height / 3, 250));
  await page.mouse.wheel(0, -100);
  await expect.poll(aligned).toBe(true);
  await page.evaluate(() => window.scrollBy(0, 8));
  await expect.poll(aligned).toBe(true);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({
    width: viewport.width + 4,
    height: viewport.height + 4,
  });
  await expect.poll(aligned).toBe(true);
  // Change to another editor document: the old board's marker must disappear.
  await page.goto('/#/work');
  await expect(page.locator('[data-screen-pointer]')).toHaveCount(0);
});

test('points at a visible tutorial control without activating it or exposing future geometry', async ({
  page,
}) => {
  await connected(page);
  let route = '';
  let controlBox: { x: number; y: number };
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s } = r.request().postDataJSON() as {
      snapshot: Snapshot;
    };
    expect(s.targets.some((t) => t.id === 'geometry:jN')).toBe(false);
    const control = s.targets.find(
      (t) => t.kind === 'control' && t.geometry.role === 'button',
    );
    expect(control).toBeDefined();
    route = s.screen!.route;
    controlBox = await page.evaluate(async (id) => {
      // eslint-disable-next-line @nx/enforce-module-boundaries -- Browser-side Vite URL.
      const { controls } = await import('/src/agent/screenTargets.ts');
      const r = controls()
        .find((c: { target: { id: string } }) => c.target.id === id)
        .node.getBoundingClientRect();
      return { x: r.x, y: r.y };
    }, control!.id);
    await r.fulfill({
      json: { runId, text: '', calls: [highlight(s, control!.id)] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    expect(r.request().postDataJSON().results[0]).toMatchObject({ ok: true });
    await r.fulfill({
      json: {
        runId,
        text: 'This is Next; it has not been pressed.',
        calls: [],
      },
    });
  });
  await page.goto('/#/eight-fold-star-and-octagon/watch');
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  if (await pause.count()) await pause.click();
  await open(page);
  await page.evaluate(() => {
    (window as unknown as { pointingClicks: number }).pointingClicks = 0;
    document
      .querySelector('[data-tastir-page]')!
      .addEventListener('click', () => {
        (window as unknown as { pointingClicks: number }).pointingClicks++;
      });
  });
  await ask(page);
  await expect(page.locator('.agent-answer')).toContainText(
    'has not been pressed',
  );
  expect(await page.evaluate(() => window.location.hash.slice(2))).toBe(route);
  expect(
    await page.evaluate(
      () => (window as unknown as { pointingClicks: number }).pointingClicks,
    ),
  ).toBe(0);
  const ring = await page.locator('[data-screen-pointer] rect').boundingBox();
  expect(Math.abs(ring!.x + 4 - controlBox!.x)).toBeLessThan(2);
  expect(Math.abs(ring!.y + 4 - controlBox!.y)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Clear page highlight' }).click();
  await expect(page.locator('[data-screen-pointer]')).toHaveCount(0);
});

test('points at actual visible polygons on the normal wall', async ({
  page,
}) => {
  await connected(page);
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s } = r.request().postDataJSON() as {
      snapshot: Snapshot;
    };
    const polygon = s.targets.find((t) => t.kind === 'polygon');
    expect(polygon).toBeDefined();
    await r.fulfill({
      json: { runId, text: '', calls: [highlight(s, polygon!.id)] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    expect(r.request().postDataJSON().results[0]).toMatchObject({ ok: true });
    await r.fulfill({
      json: { runId, text: 'Wall piece displayed.', calls: [] },
    });
  });
  await page.goto('/#/eight-fold-star-and-octagon');
  await open(page);
  await ask(page);
  await expect(page.locator('.agent-answer')).toHaveText(
    'Wall piece displayed.',
  );
  await expect(page.locator('[data-screen-pointer] polygon')).toBeVisible();
});

test('can point on a page without a board image and reports a page highlight accurately', async ({
  page,
}) => {
  await connected(page);
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s } = r.request().postDataJSON() as {
      snapshot: Snapshot;
    };
    expect(s.image).toBeNull();
    const control = s.targets.find((t) => t.kind === 'control');
    expect(control).toBeDefined();
    await r.fulfill({
      json: { runId, text: '', calls: [highlight(s, control!.id)] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    expect(r.request().postDataJSON().results[0]).toMatchObject({ ok: true });
    await r.fulfill({
      json: { runId, text: 'Page control highlighted.', calls: [] },
    });
  });
  await page.goto('/#/work');
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await ask(page);
  await expect(page.locator('.agent-answer')).toHaveText(
    'Page control highlighted.',
  );
  await expect(page.locator('.agent-activity')).toHaveText(
    'Page highlight displayed: target acknowledged, final response completed.',
  );
  await expect(page.locator('[data-screen-pointer] rect')).toBeVisible();
});

for (const intervention of ['zoom', 'route', 'stop'] as const) {
  test(`a ${intervention} change prevents a delayed normal-page highlight`, async ({
    page,
  }) => {
    await connected(page);
    let ready = false;
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/__agent/turn/start', async (r) => {
      const { snapshot: s } = r.request().postDataJSON() as {
        snapshot: Snapshot;
      };
      const target = s.targets.find((t) => t.kind === 'point')!;
      expect(target).toBeDefined();
      ready = true;
      await held;
      await r.fulfill({
        json: { runId, text: '', calls: [highlight(s, target.id)] },
      });
    });
    await page.route('**/__agent/turn/continue', async (r) => {
      expect(r.request().postDataJSON().results[0].ok).toBe(false);
      await r.fulfill({
        json: { runId, text: 'The view changed.', calls: [] },
      });
    });
    await editor(page);
    await open(page);
    await ask(page);
    await expect.poll(() => ready).toBe(true);
    if (intervention === 'route')
      await page.evaluate(() => {
        window.location.hash = '#/work';
      });
    if (intervention === 'stop')
      await page.getByRole('button', { name: 'Stop', exact: true }).click();
    if (intervention === 'zoom') {
      const board = page.locator('[data-tastir-page] svg.drawing').first();
      const before = await board.getAttribute('viewBox');
      const b = (await board.boundingBox())!;
      await page.mouse.move(
        b.x + b.width / 2,
        Math.min(b.y + b.height / 3, 250),
      );
      await page.mouse.wheel(0, -300);
      await expect.poll(() => board.getAttribute('viewBox')).not.toBe(before);
    }
    release();
    if (intervention === 'zoom')
      await expect(page.locator('.agent-answer')).toHaveText(
        'The view changed.',
      );
    else if (intervention === 'route')
      await expect(page.locator('[data-tastir-page] .work-page')).toBeVisible();
    else
      await expect(
        page.getByRole('button', { name: 'Send current view' }),
      ).toBeEnabled();
    await expect(page.locator('[data-screen-pointer]')).toHaveCount(0);
  });
}
