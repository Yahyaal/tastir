import { test, expect, type Page, type Route } from '@playwright/test';
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
}
const navigate = (
  snapshot: { id: string; documentRevision: string },
  destinationId: string,
) => ({
  id: 'go',
  name: 'navigate',
  arguments: {
    snapshotId: snapshot.id,
    documentRevision: snapshot.documentRevision,
    label: 'Open requested page',
    destinationId,
  },
});

test('navigates across real pages, captures the destination, and returns to the intact drawing and Undo history', async ({
  page,
}) => {
  await connected(page);
  let turn = 0;
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot } = r.request().postDataJSON();
    await r.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          {
            id: 'draw',
            name: 'edit_segments',
            arguments: {
              snapshotId: snapshot.id,
              documentRevision: snapshot.documentRevision,
              label: 'Square',
              add: ['jW', 'jN', 'jE', 'jS'].map((from, i, p) => ({
                from,
                to: p[(i + 1) % 4],
              })),
              remove: [],
            },
          },
        ],
      },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results, snapshot } = r.request().postDataJSON();
    expect(results[0].ok).toBe(true);
    turn++;
    let calls: unknown[] = [];
    if (turn === 1)
      calls = [
        {
          id: 'tile',
          name: 'set_tile',
          arguments: {
            snapshotId: snapshot.id,
            documentRevision: snapshot.documentRevision,
            label: 'Square repeat',
            vertices: ['jW', 'jN', 'jE', 'jS'],
          },
        },
      ];
    if (turn === 2) calls = [navigate(snapshot, 'work')];
    if (turn === 3) {
      expect(snapshot.mode).toBe('screen');
      expect(snapshot.screen.route).toBe('work');
      expect(snapshot.image).toBeNull();
      expect(
        snapshot.targets.every((t: { kind: string }) => t.kind === 'control'),
      ).toBe(true);
      await expect(page.locator('[data-tastir-page] .work-page')).toBeVisible();
      calls = [navigate(snapshot, 'wall:eight-fold-star-and-octagon')];
    }
    if (turn === 4) {
      expect(snapshot.screen.route).toBe('eight-fold-star-and-octagon');
      expect(snapshot.image).toMatch(/^data:image\/png;base64,/);
      await expect(page.locator('[data-tastir-page] svg.wall')).toBeVisible();
      calls = [navigate(snapshot, 'assistant')];
    }
    if (turn === 5) {
      expect(snapshot.screen.route).toBe('agent');
      expect(snapshot.segments).toHaveLength(4);
    }
    await r.fulfill({
      json: {
        runId,
        text: calls.length ? '' : 'Returned with your drawing.',
        calls,
      },
    });
  });
  await page.goto('/#/agent');
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect(page.locator('.agent-answer')).toHaveText(
    'Returned with your drawing.',
  );
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 4 sides',
  );
  await expect(page.locator('.agent-activity')).toContainText(
    'Navigation completed:',
  );
  await expect(page.locator('.agent-board svg.wall')).toBeVisible();
  await page.getByRole('button', { name: 'Undo drawing edit' }).click();
  await expect(
    page.getByRole('img', { name: 'The construction so far' }),
  ).toBeVisible();
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 4 sides',
  );
  await page.getByRole('button', { name: 'Undo drawing edit' }).click();
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 0 sides',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('opens the assistant on a normal page and rejects a stale or stopped navigation reply', async ({
  page,
}) => {
  await connected(page);
  let pending: Route | undefined;
  await page.route('**/__agent/turn/start', (r) => {
    pending = r;
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    expect(r.request().postDataJSON().results[0].ok).toBe(false);
    await r.fulfill({
      json: {
        runId,
        text: 'The page changed; please send it again.',
        calls: [],
      },
    });
  });
  await page.goto('/#/work');
  await page.getByRole('button', { name: 'Open drawing assistant' }).click();
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect.poll(() => !!pending).toBe(true);
  let snapshot = pending!.request().postDataJSON().snapshot;
  expect(snapshot.image).toBeNull();
  await pending!.fulfill({
    json: {
      runId,
      text: '',
      calls: [
        {
          ...navigate(snapshot, 'library'),
          arguments: {
            ...navigate(snapshot, 'library').arguments,
            documentRevision: 'old',
          },
        },
      ],
    },
  });
  await expect(page.locator('.agent-answer')).toContainText('page changed');
  await expect(page).toHaveURL(/#\/work$/);
  pending = undefined;
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect.poll(() => !!pending).toBe(true);
  snapshot = pending!.request().postDataJSON().snapshot;
  await page.getByRole('button', { name: 'Close drawing assistant' }).click();
  await pending!
    .fulfill({
      json: { runId, text: '', calls: [navigate(snapshot, 'library')] },
    })
    .catch(() => undefined);
  await page.getByRole('button', { name: 'Open drawing assistant' }).click();
  await expect(
    page.getByRole('button', { name: 'Send current view' }),
  ).toBeEnabled();
  await expect(page).toHaveURL(/#\/work$/);
});

test('navigates to saved editor and playable wall destinations', async ({
  page,
}) => {
  await connected(page);
  await page.goto('/#/');
  const ids = await page.evaluate(async () => {
    // eslint-disable-next-line @nx/enforce-module-boundaries -- Browser-side Vite URL.
    const { addPattern } = await import('/src/editor/patterns.ts');
    // eslint-disable-next-line @nx/enforce-module-boundaries -- Browser-side Vite URL.
    const { LIBRARY } = await import('/src/app/library.ts');
    const entry = LIBRARY.find(
      (e: { id: string }) => e.id === 'eight-fold-star-and-octagon',
    );
    const source =
      typeof entry.json === 'function' ? await entry.json() : entry.json;
    const pattern = addPattern({
      ...source,
      title: 'My navigation pattern',
    });
    return pattern.id;
  });
  let turn = 0;
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot } = r.request().postDataJSON();
    expect(
      snapshot.screen.destinations.some(
        (d: { id: string }) => d.id === `editor:${ids}`,
      ),
    ).toBe(true);
    await r.fulfill({
      json: { runId, text: '', calls: [navigate(snapshot, `editor:${ids}`)] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { snapshot, results } = r.request().postDataJSON();
    expect(results[0].ok).toBe(true);
    turn++;
    if (turn === 1) {
      await expect(page.locator('[data-tastir-page] .editor')).toBeVisible();
      await r.fulfill({
        json: {
          runId,
          text: '',
          calls: [navigate(snapshot, `wall:mine/${ids}`)],
        },
      });
    } else {
      expect(snapshot.screen.route).toBe(`mine/${ids}`);
      await expect(page.locator('[data-tastir-page] svg.wall')).toBeVisible();
      await r.fulfill({
        json: { runId, text: 'Saved wall opened.', calls: [] },
      });
    }
  });
  await page.getByRole('button', { name: 'Open drawing assistant' }).click();
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect(page.locator('.agent-answer')).toHaveText('Saved wall opened.');
});

test('navigation honors the normal unsaved-design question and preserves the changed palette', async ({
  page,
}) => {
  await connected(page);
  await page.goto('/#/eight-fold-star-and-octagon/result');
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Navigation guard wall');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Saved as “Navigation guard wall”.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('group', { name: 'Palette', exact: true })
    .getByRole('button', { name: 'Marrakech', exact: true })
    .click();
  const address = page.url();
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot } = r.request().postDataJSON();
    await r.fulfill({
      json: { runId, text: '', calls: [navigate(snapshot, 'library')] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results } = r.request().postDataJSON();
    expect(results[0].ok).toBe(false);
    await r.fulfill({
      json: {
        runId,
        text: 'Your changes need your choice before leaving.',
        calls: [],
      },
    });
  });
  await page.getByRole('button', { name: 'Open drawing assistant' }).click();
  await page.getByRole('button', { name: 'Send current view' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(address);
  await dialog.getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(page.locator('.agent-answer')).toContainText('need your choice');
  await expect(
    page
      .getByRole('group', { name: 'Palette', exact: true })
      .getByRole('button', { name: 'Marrakech', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('returning from the editor preserves its changes and saves the assistant version as a new pattern', async ({
  page,
}) => {
  await connected(page);
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot } = r.request().postDataJSON();
    await r.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          {
            id: 'draw',
            name: 'edit_segments',
            arguments: {
              snapshotId: snapshot.id,
              documentRevision: snapshot.documentRevision,
              label: 'A square',
              add: ['jW', 'jN', 'jE', 'jS'].map((from, i, p) => ({
                from,
                to: p[(i + 1) % 4],
              })),
              remove: [],
            },
          },
        ],
      },
    });
  });
  await page.route('**/__agent/turn/continue', (r) =>
    r.fulfill({ json: { runId, text: 'Square drawn.', calls: [] } }),
  );
  await page.goto('/#/agent');
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect(page.locator('.agent-answer')).toHaveText('Square drawn.');
  await page
    .getByRole('button', { name: 'Keep in My patterns', exact: true })
    .click();
  const originalHref = await page
    .getByRole('link', { name: 'Open in editor' })
    .getAttribute('href');
  const originalId = originalHref!.split('/').at(-1)!;
  await page.getByRole('link', { name: 'Open in editor' }).click();
  await page
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Edited outside the assistant');
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem('tastir.patterns') ?? '[]').find(
            (p: { id: string }) => p.id === id,
          )?.tutorial.title,
        originalId,
      ),
    )
    .toBe('Edited outside the assistant');
  await page
    .getByRole('link', { name: 'assistant workspace', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Keep in My patterns', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Keep as new pattern', exact: true })
    .click();
  const newHref = await page
    .getByRole('link', { name: 'Open in editor' })
    .getAttribute('href');
  expect(newHref).not.toBe(originalHref);
  const kept = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tastir.patterns') ?? '[]'),
  );
  expect(kept).toHaveLength(2);
  expect(
    kept.find((p: { id: string }) => p.id === originalId).tutorial.title,
  ).toBe('Edited outside the assistant');
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 4 sides',
  );
});
