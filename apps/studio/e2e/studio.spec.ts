import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The studio service, called directly as an agent's MCP server does. */
async function agent(method: 'GET' | 'POST', path: string, data?: unknown) {
  const dir = process.env['TASTIR_STUDIO_DIR'] as string;
  const { url, secret } = JSON.parse(
    await readFile(join(dir, '.service.json'), 'utf8'),
  ) as { url: string; secret: string };
  const response = await fetch(`${url}${path}`, {
    method,
    headers: { 'X-Tastir-Studio': secret, 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { status: response.status, body: (await response.json()) as any };
}

const circle = { kind: 'circle', name: 'C0', centre: 'O', through: 'A' };
const line = { kind: 'line', name: 'L0', from: 'O', to: 'A' };

test('an agent and the owner edit one drawing in the open editor', async ({
  page,
}) => {
  const made = await agent('POST', '/projects', {
    author: 'claude-code',
    title: 'Shared drawing',
  });
  const id = made.body.project as string;
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 1,
    edit: { op: 'construct', add: [circle] },
  });

  await page.goto(`/#/studio/${id}`);
  const steps = page.getByRole('navigation', { name: 'Steps' });
  await expect(steps).toContainText('Circle C0 about O through A.');
  await expect(page.getByRole('status').first()).toContainText(
    'Last: claude-code, Added C0',
  );

  // The agent's next change appears without reloading the page.
  await page.evaluate(() => ((window as any).stillHere = true));
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 2,
    edit: { op: 'construct', add: [line] },
  });
  await expect(steps).toContainText('Line L0 through O and A.');
  expect(await page.evaluate(() => (window as any).stillHere)).toBe(true);

  // The owner renames the drawing while the agent prepares its next batch.
  const title = page.getByRole('textbox', { name: 'Title' });
  await title.fill('Owner’s name for it');
  await expect(page.getByRole('status').first()).toContainText(
    'Last: owner, Renamed in Tastir',
  );

  // The agent's batch, based on the drawing before the owner's change, is
  // refused whole, and its own Undo stops at the owner's change.
  const late = await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 3,
    edit: {
      op: 'construct',
      add: [
        {
          kind: 'intersection',
          name: 'W',
          first: 'L0',
          second: 'C0',
          angle: 180,
        },
      ],
    },
  });
  expect(late.status).toBe(400);
  expect(late.body.error).toMatch(/has changed since revision 3/);
  const undo = await agent('POST', `/projects/${id}/travel`, {
    author: 'claude-code',
    revision: 4,
    direction: 'undo',
    steps: 1,
    mine: true,
  });
  expect(undo.body.error).toMatch(/made by owner/);
  const view = await agent('GET', `/projects/${id}`);
  expect(view.body.drawing.title).toBe('Owner’s name for it');
  expect(
    view.body.history.undo.map((e: { author: string }) => e.author),
  ).toEqual(['owner', 'claude-code', 'claude-code']);

  // Undo in the editor reverses the owner's change through the studio too.
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: 'Steps' })
    .click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Control+z');
  await expect
    .poll(
      async () => (await agent('GET', `/projects/${id}`)).body.drawing.title,
    )
    .toBe('Shared drawing');
});

test('the owner’s change is kept when an agent saves first', async ({
  page,
}) => {
  const made = await agent('POST', '/projects', {
    author: 'claude-code',
    title: 'Clash',
  });
  const id = made.body.project as string;
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 1,
    edit: { op: 'construct', add: [circle] },
  });
  await page.goto(`/#/studio/${id}`);
  const steps = page.getByRole('navigation', { name: 'Steps' });
  await expect(steps).toContainText('Circle C0 about O through A.');

  // The agent saves while the owner's rename is on its way.
  let clashed = false;
  await page.route(`**/__studio/projects/${id}/edit`, async (route) => {
    if (!clashed) {
      clashed = true;
      await agent('POST', `/projects/${id}/edit`, {
        author: 'claude-code',
        revision: 2,
        edit: { op: 'construct', add: [line] },
      });
    }
    await route.continue();
  });
  await page.getByRole('textbox', { name: 'Title' }).fill('Mine');
  await expect(page.getByRole('status').first()).toContainText(
    'An agent changed the drawing while you were editing',
  );
  await expect(steps).toContainText('Line L0 through O and A.');
  const kept = page.getByRole('region', { name: 'Your kept change' });
  await expect(kept).toContainText('Renamed in Tastir');
  // A rename cannot go on top of the agent's work without undoing it.
  await expect(
    kept.getByRole('button', { name: 'Add my change on top' }),
  ).toHaveCount(0);
  // Nothing re-sends the refused change over the agent's work (the editor
  // once did, a moment after the agent's drawing arrived).
  await page.waitForTimeout(1000);
  const after = (await agent('GET', `/projects/${id}`)).body;
  expect(after.drawing.title).toBe('Clash');
  expect(after.history.undo[0].label).toBe('Added L0');

  // A reload keeps it, and it can become a project of its own.
  await page.reload();
  await kept.getByRole('button', { name: 'Keep mine as a copy' }).click();
  await expect(page).toHaveURL(/#\/studio\/mine-your-version-/);
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
    'Mine (your version)',
  );
  expect((await agent('GET', `/projects/${id}`)).body.drawing.title).toBe(
    'Clash',
  );
});

test('the owner adds a kept step on top of the agent’s, or discards it', async ({
  page,
}) => {
  const made = await agent('POST', '/projects', {
    author: 'claude-code',
    title: 'On top',
  });
  const id = made.body.project as string;
  const base = (await agent('GET', `/projects/${id}/draft`)).body.draft;
  const mine = {
    ...base,
    steps: [
      ...base.steps,
      {
        id: base.steps.length + 1,
        text: 'Circle r about A through O.',
        create: { r: { circle: { centre: 'A', through: 'O' } } },
      },
    ],
  };
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 1,
    edit: { op: 'construct', add: [circle] },
  });
  // As the page left it after the clash, before a reload.
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key as string, value as string);
        sessionStorage.setItem('seeded', '1');
      }
    },
    [`tastir-studio-kept-${id}`, JSON.stringify({ base, mine })],
  );
  await page.goto(`/#/studio/${id}`);
  const kept = page.getByRole('region', { name: 'Your kept change' });
  await kept.getByRole('button', { name: 'Add my change on top' }).click();
  await expect(kept).toHaveCount(0);
  const steps = page.getByRole('navigation', { name: 'Steps' });
  await expect(steps).toContainText('Circle C0 about O through A.');
  await expect(steps).toContainText('Circle r about A through O.');
  const view = (await agent('GET', `/projects/${id}`)).body;
  expect(view.history.undo[0].author).toBe('owner');
  expect(view.history.undo[0].label).toMatch(/kept after a clash/);

  // Discarding a kept change leaves the drawing as it is.
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key as string, value as string),
    [`tastir-studio-kept-${id}`, JSON.stringify({ base, mine })],
  );
  await page.reload();
  await kept.getByRole('button', { name: 'Discard mine' }).click();
  await expect(kept).toHaveCount(0);
  await page.reload();
  await expect(steps).toContainText('Circle r about A through O.');
  await expect(kept).toHaveCount(0);
});

test('the studio lists projects and starts one from O and A', async ({
  page,
}) => {
  await page.goto('/#/studio');
  await page
    .getByRole('textbox', { name: 'New project from O and A' })
    .fill('From the page');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page).toHaveURL(/#\/studio\/from-the-page-/);
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
    'From the page',
  );
  const scroll = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  expect(scroll).toBeLessThanOrEqual(0);
});

test('an agent marks an element and asks the owner about it', async ({
  page,
}) => {
  const made = await agent('POST', '/projects', {
    author: 'claude-code',
    title: 'Questions',
  });
  const id = made.body.project as string;
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 1,
    edit: { op: 'construct', add: [circle, line] },
  });
  await page.goto(`/#/studio/${id}`);
  await expect(page.getByRole('navigation', { name: 'Steps' })).toContainText(
    'Line L0 through O and A.',
  );

  const asked = await agent('POST', `/projects/${id}/questions`, {
    author: 'claude-code',
    text: 'Should the pattern start from this circle?',
    about: 'C0',
  });
  const question = asked.body.question.id as number;
  const panel = page.getByRole('region', { name: 'Studio notes' });
  await expect(panel).toContainText('Questions for you');
  await expect(panel).toContainText(
    'Should the pattern start from this circle?',
  );
  await expect(panel.getByText('C0', { exact: true })).toBeVisible();
  await expect(page.locator('svg .glow').first()).toBeAttached();

  await panel
    .getByRole('textbox', { name: 'Your answer to claude-code' })
    .fill('Yes, start there.');
  await panel.getByRole('button', { name: 'Answer' }).click();
  await expect(panel).not.toContainText('Questions for you');
  const reply = await agent('GET', `/projects/${id}/questions/${question}`);
  expect(reply.body.answer).toMatchObject({
    author: 'owner',
    text: 'Yes, start there.',
  });

  await panel
    .getByRole('textbox', { name: 'Note for the agents' })
    .fill('Try eight-fold next.');
  await panel.getByRole('button', { name: 'Post' }).click();
  await expect(panel).toContainText('owner: Try eight-fold next.');
  await panel.getByRole('button', { name: 'Clear marks' }).click();
  await expect(panel.getByText('C0', { exact: true })).toHaveCount(0);
});

test('the owner adds a photo, lines it up, and sees the ink over it', async ({
  page,
}) => {
  const made = await agent('POST', '/projects', {
    author: 'owner',
    title: 'Recreate a star',
  });
  const id = made.body.project as string;
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 1,
    edit: { op: 'construct', add: [circle, line] },
  });
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude-code',
    revision: 2,
    edit: { op: 'ink', add: [{ from: 'O', to: 'A' }] },
  });
  await page.goto(`/#/studio/${id}`);
  const panel = page.getByRole('region', { name: 'Studio notes' });
  await panel
    .getByLabel('Add a photo to recreate')
    .setInputFiles('apps/player/public/photos/itimad-star-and-octagon.jpg');
  const photo = panel.getByRole('img', { name: 'The reference photo' });
  await expect(photo).toBeVisible();
  await panel.getByRole('button', { name: 'Line up: place O and A' }).click();
  const box = (await photo.boundingBox())!;
  await photo.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await photo.click({ position: { x: box.width * 0.75, y: box.height / 2 } });
  await expect(
    panel.getByRole('img', {
      name: 'The reference photo with the ink drawn over it in magenta',
    }),
  ).toBeVisible();
  const view = await agent('GET', `/projects/${id}`);
  expect(view.body.reference).toMatchObject({
    aligned: true,
    source: 'itimad-star-and-octagon.jpg',
  });
  expect(view.body.reference.align.a.x).toBeGreaterThan(
    view.body.reference.align.o.x,
  );
});

test('the owner judges a contest without seeing the models first', async ({
  page,
}) => {
  const square = [
    circle,
    line,
    { kind: 'intersection', name: 'W', first: 'L0', second: 'C0', angle: 180 },
    { kind: 'circle', name: 'C1', centre: 'A', through: 'W' },
    { kind: 'circle', name: 'C2', centre: 'W', through: 'A' },
    { kind: 'intersection', name: 'T', first: 'C1', second: 'C2', angle: 90 },
    { kind: 'intersection', name: 'B', first: 'C1', second: 'C2', angle: 270 },
    { kind: 'line', name: 'Axis', from: 'T', to: 'B' },
    { kind: 'intersection', name: 'N', first: 'Axis', second: 'C0', angle: 90 },
    {
      kind: 'intersection',
      name: 'S',
      first: 'Axis',
      second: 'C0',
      angle: 270,
    },
  ];
  const good = (
    await agent('POST', '/projects', { author: 'contest', title: 'Contest a' })
  ).body.project as string;
  const empty = (
    await agent('POST', '/projects', { author: 'contest', title: 'Contest b' })
  ).body.project as string;
  let v = (
    await agent('POST', `/projects/${good}/edit`, {
      author: 'model-x',
      revision: 1,
      edit: { op: 'construct', add: square },
    })
  ).body;
  v = (
    await agent('POST', `/projects/${good}/edit`, {
      author: 'model-x',
      revision: v.revision,
      edit: {
        op: 'ink',
        add: [
          { from: 'A', to: 'N' },
          { from: 'N', to: 'W' },
          { from: 'W', to: 'S' },
          { from: 'S', to: 'A' },
        ],
      },
    })
  ).body;
  await agent('POST', `/projects/${good}/edit`, {
    author: 'model-x',
    revision: v.revision,
    edit: { op: 'tile', vertices: ['A', 'N', 'W', 'S'] },
  });
  const dir = process.env['TASTIR_STUDIO_DIR'] as string;
  const { mkdir, writeFile } = await import('node:fs/promises');
  await mkdir(join(dir, 'contests'), { recursive: true });
  const id = `square-test-${Date.now()}`;
  await writeFile(
    join(dir, 'contests', `${id}.json`),
    JSON.stringify({
      id,
      brief: {
        id: 'square',
        title: 'Square tile',
        text: 'Draw the square.',
        goals: {},
      },
      started: new Date().toISOString(),
      runs: [
        {
          model: 'model-x',
          project: good,
          seconds: 30,
          outcome: 'finished',
          edits: 3,
          problems: [],
        },
        {
          model: 'model-y',
          project: empty,
          seconds: 900,
          outcome: 'stopped',
          reason: 'Usage limit',
          edits: 0,
          problems: ['Nothing is inked yet.'],
        },
      ],
    }),
  );
  await page.goto(`/#/studio/contest/${id}`);
  await expect(
    page.getByRole('heading', { name: 'Square tile' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: /The wall of design/ }),
  ).toBeVisible();
  await expect(page.getByText('Stopped before it finished.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('model-x');
  await page.getByRole('button', { name: /Pick design/ }).click();
  await expect(
    page.getByRole('button', { name: 'Your favourite' }),
  ).toBeVisible();
  await expect(page.locator('body')).toContainText('model-x, 30 s, 3 edits');
  await expect(page.locator('body')).toContainText(
    'model-y, 900 s, 0 edits, Usage limit',
  );
});
