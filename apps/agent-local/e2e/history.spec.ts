import { sendCurrentView, prepareRequest } from './chatHelpers';
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
  scope: 'steps' | 'assistant' = 'steps',
): ToolCall => ({
  id: `history-${direction}-${s.id}`,
  name: 'travel_history',
  arguments: {
    snapshotId: s.id,
    documentRevision: s.documentRevision,
    direction,
    scope,
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
  await sendCurrentView(page);
}

test('new geometry is framed, and the assistant can fit a zoomed view and continue with its new points', async ({
  page,
}) => {
  await connected(page);
  let fitting = false;
  let before: Snapshot;
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s, prompt } = r.request().postDataJSON();
    before = s;
    fitting = prompt === 'Fit and draw';
    const call = fitting
      ? {
          id: 'fit',
          name: 'fit_view',
          arguments: {
            snapshotId: s.id,
            documentRevision: s.documentRevision,
            label: 'Fit construction',
          },
        }
      : {
          id: 'extend',
          name: 'construct',
          arguments: {
            snapshotId: s.id,
            documentRevision: s.documentRevision,
            label: 'Extend above the old view',
            remove: [],
            add: [
              {
                kind: 'circle',
                name: 'OuterCircle',
                centre: 'N',
                through: 'S',
              },
              { kind: 'line', name: 'VerticalAxis', from: 'N', to: 'S' },
              {
                kind: 'intersection',
                name: 'FarTop',
                first: 'OuterCircle',
                second: 'VerticalAxis',
                angle: 90,
              },
            ],
          },
        };
    if (fitting)
      expect(s.targets.some((t: { id: string }) => t.id === 'FarTop')).toBe(
        false,
      );
    await r.fulfill({ json: { runId, text: '', calls: [call] } });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results, snapshot: s } = r.request().postDataJSON();
    expect(results[0].ok).toBe(true);
    expect(s.targets.some((t: { id: string }) => t.id === 'FarTop')).toBe(true);
    let call: unknown;
    if (fitting && results[0].callId === 'fit') {
      expect(s.documentRevision).toBe(before.documentRevision);
      expect(s.history).toEqual(before.history);
      expect(s.id).not.toBe(before.id);
      expect(s.image).not.toBe(before.image);
      expect(s.mode).toBe('construction');
      call = {
        id: 'ink',
        name: 'edit_segments',
        arguments: {
          snapshotId: s.id,
          documentRevision: s.documentRevision,
          label: 'Join fitted point',
          add: [{ from: 'FarTop', to: 'N' }],
          remove: [],
        },
      };
    }
    await r.fulfill({
      json: {
        runId,
        text: call ? '' : fitting ? 'Fitted and drawn.' : 'Built.',
        calls: call ? [call] : [],
      },
    });
  });
  await page.goto('/#/agent');
  await send(page, 'Build');
  await expect(page.locator('.agent-answer')).toHaveText('Built.');
  const board = page.locator('.agent-board svg.drawing');
  await board.scrollIntoViewIfNeeded();
  const bounds = (await board.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  const fittedBox = await board.getAttribute('viewBox');
  await page.mouse.wheel(0, -1400);
  await expect.poll(() => board.getAttribute('viewBox')).not.toBe(fittedBox);
  await send(page, 'Fit and draw');
  await expect(page.locator('.agent-answer')).toHaveText('Fitted and drawn.');
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 1 side',
  );
  await page
    .getByRole('button', { name: 'Undo drawing edit', exact: true })
    .click();
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 0 sides',
  );
  await expect(page.locator('.agent-constructions li')).toHaveCount(3);
});

test('authored history survives requests and assistant-only Undo cannot cross a manual edit', async ({
  page,
}) => {
  await connected(page);
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s, prompt } = r.request().postDataJSON();
    if (prompt !== 'Draw') {
      expect(s.history.undo.map((a: { source: string }) => a.source)).toEqual([
        'manual',
        'assistant',
      ]);
      expect(s.history.undo[1].requestId).toBe(runId);
    }
    await r.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          prompt === 'Draw'
            ? squareCall(s)
            : historyCall(
                s,
                'undo',
                2,
                prompt === 'Undo your changes' ? 'assistant' : 'steps',
              ),
        ],
      },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results, snapshot } = r.request().postDataJSON();
    if (!results[0].ok) {
      expect(results[0].message).toContain('manual or unidentified');
      expect(snapshot).toBeUndefined();
    }
    await r.fulfill({
      json: {
        runId,
        text: !results[0].ok
          ? 'Manual edit protected.'
          : snapshot.segments.length
            ? 'Drawn.'
            : 'All undone.',
        calls: [],
      },
    });
  });
  await page.goto('/#/agent');
  await send(page, 'Draw');
  await expect(page.locator('.agent-answer')).toHaveText('Drawn.');
  await page
    .locator('.agent-side')
    .first()
    .getByRole('button', { name: 'Remove side 1', exact: true })
    .click();
  await send(page, 'Undo your changes');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Manual edit protected.',
  );
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 3 sides',
  );
  await send(page, 'Undo all changes');
  await expect(page.locator('.agent-answer')).toHaveText('All undone.');
  await expect(page.locator('.agent-edits h2')).toHaveText(
    'Your drawing · 0 sides',
  );
});

test('model Undo and Redo restore real ink, tile and colors, sharing the manual history', async ({
  page,
}) => {
  await connected(page);
  let turn = 0;
  let sent: Snapshot;
  await page.route('**/__agent/turn/start', async (r) => {
    sent = r.request().postDataJSON().snapshot;
    expect(sent.history).toMatchObject({ undoSteps: 0, redoSteps: 0 });
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
      expect(s.history).toMatchObject({ undoSteps: 3, redoSteps: 0 });
      expect(s.history!.undo.map((a) => a.source)).toEqual([
        'assistant',
        'assistant',
        'assistant',
      ]);
      expect(new Set(s.history!.undo.map((a) => a.requestId))).toEqual(
        new Set([runId]),
      );
      call = historyCall(s, 'undo', 3, 'assistant');
    } else if (turn === 4) {
      expect(s.segments).toEqual([]);
      expect(s.repeat).toBeNull();
      expect(s.mode).toBe('construction');
      expect(s.history).toMatchObject({ undoSteps: 0, redoSteps: 3 });
      call = historyCall(s, 'redo', 3, 'assistant');
    } else {
      expect(s.mode).toBe('repeat');
      expect(s.segments).toHaveLength(4);
      expect(s.repeat!.types[0]!.color).toBe('#2453a6');
      expect(s.history).toMatchObject({ undoSteps: 3, redoSteps: 0 });
      expect(s.history!.undo.map((a) => a.source)).toEqual([
        'assistant',
        'assistant',
        'assistant',
      ]);
      expect(new Set(s.history!.undo.map((a) => a.requestId))).toEqual(
        new Set([runId]),
      );
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
    await prepareRequest(page);
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
