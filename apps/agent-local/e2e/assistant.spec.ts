import { test, expect, type Page, type Route } from '@playwright/test';
import sharp from 'sharp';

const runId = '55c4c0a2-487f-4c25-a25d-79518ef86021';
async function connected(page: Page) {
  await page.route('**/__agent/status', (route) =>
    route.fulfill({
      json: {
        profiles: [
          {
            id: 'mock-account',
            label: 'Simulated test account',
            connected: true,
          },
        ],
        activeId: 'mock-account',
        connected: true,
        sharing: true,
        signingIn: false,
        error: null,
      },
    }),
  );
  await page.route('**/__agent/models', (route) =>
    route.fulfill({ json: [{ slug: 'mock-model', name: 'Simulated model' }] }),
  );
}

const squareCall = (snapshot: { id: string; documentRevision: string }) => ({
  id: 'draw-call',
  name: 'edit_segments',
  arguments: {
    snapshotId: snapshot.id,
    documentRevision: snapshot.documentRevision,
    label: 'Draw the square',
    remove: [],
    add: ['jW', 'jN', 'jE', 'jS'].map((from, i, points) => ({
      from,
      to: points[(i + 1) % 4],
    })),
  },
});

test('draws four editable sides, sends the resulting image, undoes in one step and keeps an editor copy', async ({
  page,
}) => {
  await connected(page);
  let initialImage = '';
  let initialRevision = '';
  await page.route('**/__agent/turn/start', async (route) => {
    const { snapshot } = route.request().postDataJSON();
    initialImage = snapshot.image;
    initialRevision = snapshot.documentRevision;
    await route.fulfill({
      json: { runId, text: '', calls: [squareCall(snapshot)] },
    });
  });
  await page.route('**/__agent/turn/continue', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.results).toEqual([
      expect.objectContaining({ callId: 'draw-call', ok: true }),
    ]);
    expect(body.snapshot.documentRevision).not.toBe(initialRevision);
    expect(body.snapshot.image).not.toBe(initialImage);
    expect(body.snapshot.segments).toHaveLength(4);
    expect(await page.locator('.ink-piece.inked').count()).toBe(4);
    await route.fulfill({
      json: { runId, text: 'The four sides are drawn.', calls: [] },
    });
  });
  await page.goto('/#/agent');
  await page.getByRole('button', { name: 'Use square request' }).click();
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect(page.locator('.agent-answer')).toHaveText(
    'The four sides are drawn.',
  );
  await expect(page.getByText(/Drawing updated:/)).toBeVisible();
  await page.getByRole('button', { name: 'Undo drawing edit' }).click();
  await expect(page.locator('.ink-piece.inked')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo drawing edit' }).click();
  await expect(page.locator('.ink-piece.inked')).toHaveCount(4);
  await page
    .getByRole('combobox', { name: 'Side 1 start', exact: true })
    .selectOption('O');
  await expect(
    page.getByRole('combobox', { name: 'Side 1 start', exact: true }),
  ).toHaveValue('O');
  await page.getByRole('button', { name: 'Undo drawing edit' }).click();
  await expect(
    page.getByRole('combobox', { name: 'Side 1 start', exact: true }),
  ).toHaveValue('jW');
  await page
    .getByRole('button', { name: 'Remove side 1', exact: true })
    .click();
  await expect(page.locator('.ink-piece.inked')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo drawing edit' }).click();
  await page.getByRole('button', { name: 'Keep in My patterns' }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tastir.patterns') ?? '[]'),
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].tutorial.ink.paths).toEqual(
    ['jW', 'jN', 'jE', 'jS'].map((from, i, points) => ({
      through: [from, points[(i + 1) % 4]],
    })),
  );
  await page.getByRole('link', { name: 'Open in editor' }).click();
  await expect(page).toHaveURL(new RegExp(`/edit/${saved[0].id}$`));
  await expect(
    page.getByRole('img', { name: 'The construction so far' }),
  ).toBeVisible();
});

for (const intervention of ['selection', 'stop'] as const) {
  test(`a ${intervention} change prevents a delayed drawing edit`, async ({
    page,
  }) => {
    await connected(page);
    let pending: Route | undefined;
    await page.route('**/__agent/turn/start', (route) => {
      pending = route;
    });
    await page.route('**/__agent/turn/continue', async (route) => {
      expect(route.request().postDataJSON().results[0].ok).toBe(false);
      await route.fulfill({
        json: { runId, text: 'Please send a new view.', calls: [] },
      });
    });
    await page.goto('/#/agent');
    await page.getByRole('button', { name: 'Send current view' }).click();
    await expect.poll(() => !!pending).toBe(true);
    const { snapshot } = pending!.request().postDataJSON();
    if (intervention === 'stop')
      await page.getByRole('button', { name: 'Stop', exact: true }).click();
    else
      await page
        .getByRole('combobox', { name: 'Selected object', exact: true })
        .selectOption('A');
    await pending!
      .fulfill({ json: { runId, text: '', calls: [squareCall(snapshot)] } })
      .catch(() => undefined);
    if (intervention === 'selection')
      await expect(page.locator('.agent-answer')).toHaveText(
        'Please send a new view.',
      );
    await expect(page.locator('.ink-piece.inked')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Undo drawing edit' }),
    ).toBeDisabled();
  });
}

test('a fresh local companion requires sign-in before sending a view', async ({
  page,
}) => {
  await page.goto('/#/agent');
  await expect(
    page.getByRole('heading', { name: 'Drawing assistant' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'The construction so far' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continue with ChatGPT', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Send current view' }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('sends a real board PNG and acknowledges the displayed highlight before continuing', async ({
  page,
}) => {
  await connected(page);
  let image = '';
  let acknowledged = false;
  await page.route('**/__agent/turn/start', async (route) => {
    const body = route.request().postDataJSON();
    image = body.snapshot.image;
    expect(body.snapshot.selected).toBe('O');
    expect(
      body.snapshot.targets.some((target: { id: string }) => target.id === 'O'),
    ).toBe(true);
    await route.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          {
            id: 'call',
            name: 'highlight_target',
            arguments: {
              snapshotId: body.snapshot.id,
              targetId: 'O',
              label: 'The center of this construction',
            },
          },
        ],
      },
    });
  });
  await page.route('**/__agent/turn/continue', async (route) => {
    expect(route.request().postDataJSON().results).toEqual([
      {
        callId: 'call',
        ok: true,
        message: 'Highlighted O: The center of this construction',
      },
    ]);
    expect(await page.locator('.agent-mark').count()).toBe(1);
    acknowledged = true;
    await route.fulfill({
      json: { runId, text: 'I have highlighted the center.', calls: [] },
    });
  });
  await page.goto('/#/agent');
  await expect(
    page.getByRole('button', { name: 'Send current view' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect(page.locator('.agent-answer')).toHaveText(
    'I have highlighted the center.',
  );
  expect(acknowledged).toBe(true);
  expect(image).toMatch(/^data:image\/png;base64,/);
  const decoded = sharp(Buffer.from(image.split(',')[1]!, 'base64'));
  const meta = await decoded.metadata();
  expect(meta.width).toBeGreaterThan(200);
  const stats = await decoded.stats();
  expect(stats.channels[0]!.stdev).toBeGreaterThan(2);
  await expect(page.getByText(/Live check completed:/)).toBeVisible();
  const svg = page.getByRole('img', { name: 'The construction so far' });
  await svg.scrollIntoViewIfNeeded();
  const before = await svg.getAttribute('viewBox');
  const bounds = await svg.boundingBox();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.wheel(0, -200);
  await expect(svg).not.toHaveAttribute('viewBox', before!);
  await expect
    .poll(async () => page.locator('.agent-mark svg').getAttribute('viewBox'))
    .toBe(await svg.getAttribute('viewBox'));
});

test('rejects a reply based on an older selection', async ({ page }) => {
  await connected(page);
  let pending: Route | undefined;
  await page.route('**/__agent/turn/start', (route) => {
    pending = route;
  });
  await page.route('**/__agent/turn/continue', async (route) => {
    expect(route.request().postDataJSON().results[0].ok).toBe(false);
    await route.fulfill({
      json: {
        runId,
        text: 'The view changed. Please send it again.',
        calls: [],
      },
    });
  });
  await page.goto('/#/agent');
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect.poll(() => !!pending).toBe(true);
  const snapshot = pending!.request().postDataJSON().snapshot;
  await page
    .getByRole('combobox', { name: 'Selected object', exact: true })
    .selectOption('A');
  await pending!.fulfill({
    json: {
      runId,
      text: '',
      calls: [
        {
          id: 'call',
          name: 'highlight_target',
          arguments: {
            snapshotId: snapshot.id,
            targetId: 'O',
            label: 'Old view',
          },
        },
      ],
    },
  });
  await expect(page.locator('.agent-answer')).toHaveText(
    'The view changed. Please send it again.',
  );
  await expect(page.locator('.agent-mark')).toHaveCount(0);
  await expect(page.getByText(/Live check completed:/)).toHaveCount(0);
});

test('Stop prevents late responses from marking the board', async ({
  page,
}) => {
  await connected(page);
  let pending: Route | undefined;
  let continued = false;
  await page.route('**/__agent/turn/start', (route) => {
    pending = route;
  });
  await page.route('**/__agent/turn/continue', (route) => {
    continued = true;
    return route.fulfill({ json: {} });
  });
  await page.goto('/#/agent');
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect.poll(() => !!pending).toBe(true);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  const snapshot = pending!.request().postDataJSON().snapshot;
  await pending!
    .fulfill({
      json: {
        runId,
        text: '',
        calls: [
          {
            id: 'late',
            name: 'highlight_target',
            arguments: {
              snapshotId: snapshot.id,
              targetId: 'O',
              label: 'Late',
            },
          },
        ],
      },
    })
    .catch(() => undefined);
  await expect(
    page.getByRole('button', { name: 'Send current view' }),
  ).toBeEnabled();
  await expect(page.locator('.agent-mark')).toHaveCount(0);
  expect(continued).toBe(false);
});

test('board capture includes canvas layers and omits assistant annotations', async ({
  page,
}) => {
  await page.goto('/#/agent');
  await expect(
    page.getByRole('img', { name: 'The construction so far' }),
  ).toBeVisible();
  const image = await page.evaluate(async () => {
    // eslint-disable-next-line @nx/enforce-module-boundaries -- This is a browser-side Vite URL, not a Node module import.
    const { captureBoard } = await import('/src/agent/capture.ts');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.innerHTML =
      '<foreignObject x="10" y="10" width="40" height="40"><canvas xmlns="http://www.w3.org/1999/xhtml" width="40" height="40"></canvas></foreignObject><rect data-agent-annotation="true" x="0" y="0" width="100" height="100" fill="black" />';
    document.body.appendChild(svg);
    const canvas = svg.querySelector('canvas')!;
    canvas.getContext('2d')!.fillStyle = 'rgb(220, 0, 0)';
    canvas.getContext('2d')!.fillRect(0, 0, 40, 40);
    try {
      return await captureBoard(svg);
    } finally {
      svg.remove();
    }
  });
  const pixel = await sharp(Buffer.from(image.split(',')[1]!, 'base64'))
    .extract({ left: 20, top: 20, width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer();
  expect([...pixel]).toEqual([220, 0, 0]);
});
