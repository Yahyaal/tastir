import { test, expect, type Page } from '@playwright/test';
import type { Snapshot, ToolCall } from '@tastir/agent-protocol';

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
const historyCall = (
  s: Snapshot,
  direction: 'undo' | 'redo',
  steps = 1,
): ToolCall => ({
  id: 'history',
  name: 'travel_history',
  arguments: {
    snapshotId: s.id,
    documentRevision: s.documentRevision,
    direction,
    steps,
    label: `${direction} ${steps} edits`,
  },
});
const squareCall = (s: Snapshot): ToolCall => ({
  id: 'square',
  name: 'edit_segments',
  arguments: {
    snapshotId: s.id,
    documentRevision: s.documentRevision,
    label: 'Square',
    remove: [],
    add: ['jW', 'jN', 'jE', 'jS'].map((from, i, p) => ({
      from,
      to: p[(i + 1) % 4]!,
    })),
  },
});
async function send(page: Page, prompt: string) {
  await page.getByRole('textbox', { name: 'Your request' }).fill(prompt);
  await page.getByRole('button', { name: 'Send current view' }).click();
}

test('model Undo and Redo restore real ink, tile and colors, sharing the manual history', async ({
  page,
}) => {
  await connected(page);
  let turn = 0;
  let sent: Snapshot;
  await page.route('**/__agent/turn/start', async (r) => {
    sent = r.request().postDataJSON().snapshot;
    expect(sent.history).toEqual({ undoSteps: 0, redoSteps: 0 });
    await r.fulfill({ json: { runId, text: '', calls: [squareCall(sent)] } });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results, snapshot: s } = r.request().postDataJSON() as {
      results: { ok: boolean }[];
      snapshot: Snapshot;
    };
    expect(results[0]!.ok).toBe(true);
    expect(s.id).not.toBe(sent.id);
    expect(s.documentRevision).not.toBe(sent.documentRevision);
    expect(s.image).toMatch(/^data:image\/png;base64,/);
    sent = s;
    turn++;
    let call: ToolCall | undefined;
    if (turn === 1) {
      expect(s.segments).toHaveLength(4);
      call = {
        id: 'tile',
        name: 'set_tile',
        arguments: {
          snapshotId: s.id,
          documentRevision: s.documentRevision,
          label: 'Repeat',
          vertices: ['jW', 'jN', 'jE', 'jS'],
        },
      };
    } else if (turn === 2) {
      call = {
        id: 'paint',
        name: 'paint_pattern',
        arguments: {
          snapshotId: s.id,
          documentRevision: s.documentRevision,
          label: 'Blue',
          palette: null,
          colors: [{ typeId: s.repeat!.types[0]!.id, color: '#2453a6' }],
        },
      };
    } else if (turn === 3) {
      expect(s.mode).toBe('repeat');
      expect(s.repeat!.types[0]!.color).toBe('#2453a6');
      expect(s.history).toEqual({ undoSteps: 3, redoSteps: 0 });
      call = historyCall(s, 'undo', 3);
    } else if (turn === 4) {
      expect(s.segments).toEqual([]);
      expect(s.repeat).toBeNull();
      expect(s.mode).toBe('construction');
      expect(s.history).toEqual({ undoSteps: 0, redoSteps: 3 });
      call = historyCall(s, 'redo', 3);
    } else {
      expect(s.mode).toBe('repeat');
      expect(s.segments).toHaveLength(4);
      expect(s.repeat!.types[0]!.color).toBe('#2453a6');
      expect(s.history).toEqual({ undoSteps: 3, redoSteps: 0 });
    }
    await r.fulfill({
      json: {
        runId,
        text: call ? '' : 'Undo and Redo verified.',
        calls: call ? [call] : [],
      },
    });
  });
  await page.goto('/#/agent');
  await send(
    page,
    'Draw, repeat, color, undo all three edits, then redo all three.',
  );
  await expect(page.locator('.agent-answer')).toHaveText(
    'Undo and Redo verified.',
  );
  await expect(page.locator('svg.wall')).toBeVisible();
  await page
    .getByRole('button', { name: 'Undo drawing edit', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Redo drawing edit', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Redo drawing edit', exact: true })
    .click();
  await expect(page.locator('svg.wall')).toBeVisible();
});

test('empty history fails honestly without a mutation or fresh observation', async ({
  page,
}) => {
  await connected(page);
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot } = r.request().postDataJSON();
    await r.fulfill({
      json: { runId, text: '', calls: [historyCall(snapshot, 'undo')] },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results, snapshot } = r.request().postDataJSON();
    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain('Only 0 undo steps');
    expect(snapshot).toBeUndefined();
    await r.fulfill({
      json: { runId, text: 'There are no edits to undo.', calls: [] },
    });
  });
  await page.goto('/#/agent');
  await send(page, 'Undo');
  await expect(page.locator('.agent-answer')).toHaveText(
    'There are no edits to undo.',
  );
  await expect(
    page.getByRole('button', { name: 'Undo drawing edit', exact: true }),
  ).toBeDisabled();
});

for (const intervention of ['view', 'stop'] as const) {
  test(`a ${intervention} change prevents a delayed model Undo`, async ({
    page,
  }) => {
    await connected(page);
    let requested = false;
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/__agent/turn/start', async (r) => {
      const { snapshot, prompt } = r.request().postDataJSON();
      if (prompt === 'Draw') {
        await r.fulfill({
          json: { runId, text: '', calls: [squareCall(snapshot)] },
        });
      } else {
        requested = true;
        await held;
        await r.fulfill({
          json: { runId, text: '', calls: [historyCall(snapshot, 'undo')] },
        });
      }
    });
    await page.route('**/__agent/turn/continue', async (r) => {
      const { results } = r.request().postDataJSON();
      await r.fulfill({
        json: {
          runId,
          text: results[0].ok ? 'Drawn.' : 'View changed.',
          calls: [],
        },
      });
    });
    await page.route('**/__agent/turn/cancel', (r) => r.fulfill({ json: {} }));
    await page.goto('/#/agent');
    await send(page, 'Draw');
    await expect(page.locator('.agent-answer')).toHaveText('Drawn.');
    await send(page, 'Undo');
    await expect.poll(() => requested).toBe(true);
    if (intervention === 'stop')
      await page.getByRole('button', { name: 'Stop', exact: true }).click();
    else
      await page
        .getByRole('combobox', { name: 'Selected object' })
        .selectOption('A');
    release();
    if (intervention === 'view')
      await expect(page.locator('.agent-answer')).toHaveText('View changed.');
    else
      await expect(
        page.getByRole('button', { name: 'Send current view' }),
      ).toBeEnabled();
    await expect(page.locator('.agent-edits h2')).toHaveText(
      'Your drawing · 4 sides',
    );
    await expect(
      page.getByRole('button', { name: 'Redo drawing edit', exact: true }),
    ).toBeDisabled();
  });
}
