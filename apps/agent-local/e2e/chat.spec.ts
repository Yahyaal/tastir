import { test, expect, type Page, type Route } from '@playwright/test';
import type { Snapshot } from '@tastir/agent-protocol';
import { mkdir } from 'node:fs/promises';

const runId = '55c4c0a2-487f-4c25-a25d-79518ef86021';
async function connected(page: Page) {
  await page.route('**/__agent/status', (r) =>
    r.fulfill({
      json: {
        profiles: [{ id: 'mock', label: 'Test account', connected: true }],
        activeId: 'mock',
        connected: true,
        sharing: true,
        signingIn: false,
        error: null,
      },
    }),
  );
  await page.route('**/__agent/models', (r) =>
    r.fulfill({ json: [{ slug: 'mock', name: 'Test model' }] }),
  );
  await page.route('**/__agent/turn/cancel', (r) =>
    r.fulfill({ json: { stopped: true } }),
  );
}
async function send(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Your request' }).fill(text);
  await page.getByRole('button', { name: 'Send current view' }).click();
}
const tool = (s: Snapshot, name: string, args: object) => ({
  id: `${name}-${s.id}`,
  name,
  arguments: {
    snapshotId: s.id,
    documentRevision: s.documentRevision,
    label: 'Requested change',
    ...args,
  },
});

test('compact toolbar icon leaves Save usable; transcript survives follow-ups, navigation and closing; New conversation resets context', async ({
  page,
}, info) => {
  await connected(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const tabs: string[] = [];
  let resets = 0;
  await page.route('**/__agent/conversation/reset', (r) => {
    resets++;
    return r.fulfill({ json: { cleared: true } });
  });
  await page.route('**/__agent/turn/start', (r) => {
    const { prompt } = r.request().postDataJSON();
    tabs.push(r.request().headers()['x-tastir-tab']!);
    return r.fulfill({
      json: { runId, text: `Reply to: ${prompt}`, calls: [] },
    });
  });
  await page.goto('/#/alhambra-arrayanes-squares/result');
  const launch = page.getByRole('button', {
    name: 'Open drawing assistant',
    exact: true,
  });
  await expect(launch).toBeVisible();
  expect(await launch.innerText()).toBe('');
  const size = await launch.boundingBox();
  expect(size!.width).toBeLessThanOrEqual(48);
  const save = page.getByRole('button', {
    name: 'Save as my design',
    exact: true,
  });
  await expect(save).toBeVisible();
  await save.scrollIntoViewIfNeeded();
  const box = await save.boundingBox();
  expect(
    await page.evaluate(
      ({ x, y }) =>
        document.elementFromPoint(x, y)?.closest('button')?.textContent,
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    ),
  ).toContain('Save as my design');
  await launch.click();
  await send(page, 'Make the centre teal.');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Reply to: Make the centre teal.',
  );
  await send(page, 'Keep that; explain the next border.');
  await expect(page.getByRole('log')).toContainText('Make the centre teal.');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Reply to: Keep that; explain the next border.',
  );
  await expect(page.getByRole('textbox', { name: 'Your request' })).toHaveValue(
    '',
  );
  await mkdir('docs/review/assistant-chat', { recursive: true });
  await page.screenshot({
    animations: 'disabled',
    path: `docs/review/assistant-chat/${info.project.name}.png`,
  });
  await page
    .getByRole('button', { name: 'Switch to dark mode' })
    .evaluate((button: HTMLButtonElement) => button.click());
  await page.screenshot({
    animations: 'disabled',
    path: `docs/review/assistant-chat/${info.project.name}-dark.png`,
  });
  await page.getByRole('button', { name: 'Close assistant panel' }).click();
  await expect(launch).toBeFocused();
  await launch.click();
  await expect(page.getByRole('log')).toContainText(
    'Keep that; explain the next border.',
  );
  await page.evaluate(() => {
    location.hash = '#/work';
  });
  await expect(page.getByRole('log')).toContainText('Make the centre teal.');
  await page.getByRole('button', { name: 'New conversation' }).click();
  await expect(page.getByRole('log')).not.toContainText(
    'Make the centre teal.',
  );
  await send(page, 'A fresh question');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Reply to: A fresh question',
  );
  expect(resets).toBe(1);
  expect(tabs[0]).toBe(tabs[1]);
  expect(tabs[2]).not.toBe(tabs[0]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Stop retains the transcript, blocks a late reply, and makes the next message usable', async ({
  page,
}) => {
  await connected(page);
  let pending: Route | undefined;
  await page.route('**/__agent/turn/start', (r) => {
    pending = r;
  });
  await page.goto('/#/work');
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await send(page, 'Draw something');
  await expect.poll(() => !!pending).toBe(true);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Stopped.');
  await pending!
    .fulfill({
      json: { runId, text: 'Late answer must not appear', calls: [] },
    })
    .catch(() => undefined);
  await expect(page.getByRole('log')).not.toContainText(
    'Late answer must not appear',
  );
  await page.route('**/__agent/turn/start', (r) =>
    r.fulfill({
      json: { runId, text: 'Ready for the next request.', calls: [] },
    }),
  );
  await send(page, 'Try the next request');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Ready for the next request.',
  );
  await expect(page.getByRole('log')).toContainText('Draw something');
});

test('a usage limit offers Manage usage without retrying or losing the prompt', async ({
  page,
}, info) => {
  await connected(page);
  let requests = 0;
  await page.route('**/__agent/turn/start', (r) => {
    requests++;
    return r.fulfill({
      status: 429,
      json: {
        error: {
          code: 'usage_limit',
          message:
            'ChatGPT reported a usage limit for this app or your plan. Check Manage usage before trying again.',
        },
      },
    });
  });
  await page.goto('/#/work');
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await send(page, 'Use the orange-brown color from before.');
  await expect(page.locator('.agent-answer')).toContainText(
    'this app or your plan',
  );
  const usage = page.locator('.agent-usage-link');
  await expect(usage).toHaveAttribute(
    'href',
    'https://chatgpt.com/settings/usage',
  );
  await expect(usage).toHaveAttribute('target', '_blank');
  await page.getByRole('button', { name: 'Edit and retry' }).click();
  await expect(page.getByRole('textbox', { name: 'Your request' })).toHaveValue(
    'Use the orange-brown color from before.',
  );
  expect(requests).toBe(1);
  await mkdir('docs/review/assistant-feedback', { recursive: true });
  await page.screenshot({
    animations: 'disabled',
    path: `docs/review/assistant-feedback/${info.project.name}.png`,
  });
  await page
    .getByRole('button', { name: 'Switch to dark mode' })
    .evaluate((button: HTMLButtonElement) => button.click());
  await page.screenshot({
    animations: 'disabled',
    path: `docs/review/assistant-feedback/${info.project.name}-dark.png`,
  });
});

test('a temporary usage-check failure preserves an applied color edit and its receipt', async ({
  page,
}) => {
  await connected(page);
  await page.route('**/__agent/turn/start', (r) => {
    const { snapshot: s } = r.request().postDataJSON();
    return r.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          tool(s, 'paint_pattern', {
            palette: null,
            colors: [{ typeId: 'square', color: '#b86c25' }],
          }),
        ],
      },
    });
  });
  let receipts: { ok: boolean }[] = [];
  await page.route('**/__agent/turn/continue', (r) => {
    receipts = r.request().postDataJSON().results;
    return r.fulfill({
      status: 503,
      json: {
        error: {
          code: 'usage_unavailable',
          message:
            'OpenAI could not check ChatGPT usage right now. Wait a moment before trying again. This does not confirm that your allowance is used up.',
        },
      },
    });
  });
  await page.goto('/#/alhambra-arrayanes-squares/result');
  await page.locator('svg.wall').waitFor();
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await send(page, 'Use the previous orange-brown for the squares.');
  await expect(page.locator('.agent-answer')).toContainText(
    'Changes already applied are kept.',
  );
  await expect(page.locator('.agent-answer')).toContainText(
    'does not confirm that your allowance is used up',
  );
  await expect(page.locator('.agent-answer')).not.toContainText(
    'No new tool actions were applied',
  );
  await expect(
    page.locator('svg.wall polygon[fill="#b86c25"]').first(),
  ).toBeAttached();
  await expect(page.locator('.agent-action-receipts')).toHaveCount(1);
  await expect(page.locator('.agent-usage-link')).toHaveCount(0);
  expect(receipts).toEqual([expect.objectContaining({ ok: true })]);
});

test('creates a normal saved pattern, edits its real construction and ink, then undoes and redoes using the editor history', async ({
  page,
}) => {
  await connected(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const receipts: boolean[] = [];
  let phase = 0;
  await page.route('**/__agent/turn/start', (r) => {
    const { snapshot: s, prompt } = r.request().postDataJSON() as {
      snapshot: Snapshot;
      prompt: string;
    };
    const name =
      prompt.startsWith('Undo') || prompt === 'Redo'
        ? 'travel_history'
        : 'create_pattern';
    return r.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          tool(
            s,
            name,
            name === 'create_pattern'
              ? { name: 'My chat construction' }
              : {
                  direction: prompt === 'Redo' ? 'redo' : 'undo',
                  steps: 1,
                  scope: 'assistant',
                },
          ),
        ],
      },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { snapshot: s, results } = r.request().postDataJSON() as {
      snapshot: Snapshot;
      results: { ok: boolean }[];
    };
    receipts.push(results[0]!.ok);
    if (!results[0]!.ok) {
      await r.fulfill({
        json: { runId, text: 'Your manual edit was preserved.', calls: [] },
      });
      return;
    }
    expect(results[0]!.ok).toBe(true);
    expect(s.editor).not.toBeNull();
    let calls: unknown[] = [];
    if (phase++ === 0)
      calls = [
        tool(s, 'apply_steps', {
          remove: [],
          steps: [
            {
              text: 'Draw the compass circle.',
              createJson: JSON.stringify({
                C0: { circle: { centre: 'O', through: 'A' } },
              }),
            },
            {
              text: 'Draw a second circle and let the drawing frame grow.',
              createJson: JSON.stringify({
                C1: { circle: { centre: 'A', through: 'O' } },
              }),
            },
            {
              text: 'Draw the base line.',
              createJson: JSON.stringify({
                Axis: { line: { through: ['O', 'A'] } },
              }),
            },
          ],
        }),
      ];
    else if (phase === 2)
      calls = [
        tool(s, 'edit_segments', { add: [{ from: 'O', to: 'A' }], remove: [] }),
      ];
    else if (phase === 3)
      calls = [tool(s, 'save_work', { name: 'A second saved copy' })];
    await r.fulfill({
      json: {
        runId,
        text: calls.length ? '' : 'Checked the current editor.',
        calls,
      },
    });
  });
  await page.goto('/#/work');
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await send(page, 'Create a new construction');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Checked the current editor.',
  );
  const read = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('tastir.patterns') ?? '[]'),
    );
  let patterns = await read();
  expect(patterns).toHaveLength(2);
  const originalId = /edit\/(.+)/.exec(page.url())![1];
  const original = patterns.find((p: { id: string }) => p.id === originalId);
  expect(original.tutorial.ink.paths).toHaveLength(1);
  await send(page, 'Undo');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Checked the current editor.',
  );
  await expect
    .poll(
      async () =>
        (await read()).find((p: { id: string }) => p.id === originalId).tutorial
          .ink?.paths?.length ?? 0,
    )
    .toBe(0);
  await send(page, 'Redo');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Checked the current editor.',
  );
  patterns = await read();
  expect(
    patterns.find((p: { id: string }) => p.id === originalId).tutorial.ink
      .paths,
  ).toHaveLength(1);
  expect(receipts.every(Boolean)).toBe(true);
  await page
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('My manual title');
  await send(page, 'Undo my edits');
  await expect(page.locator('.agent-answer')).toHaveText(
    'Your manual edit was preserved.',
  );
  expect(receipts.at(-1)).toBe(false);
  expect(
    (await read()).find((p: { id: string }) => p.id === originalId).tutorial
      .title,
  ).toBe('My manual title');
});
