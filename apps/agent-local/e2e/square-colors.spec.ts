import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '@tastir/agent-protocol';
const runId = '55c4c0a2-487f-4c25-a25d-79518ef86021';
const colors = ['#191919', '#167d8d', '#294e8c', '#b86c25'];
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
async function ask(page: Page, prompt: string) {
  await page.getByRole('textbox', { name: 'Your request' }).fill(prompt);
  await page.getByRole('button', { name: 'Send current view' }).click();
  await expect(page.locator('.agent-answer')).toHaveText(
    'Checked the actual updated wall.',
  );
}
test('colors normal square bands, undoes and redoes by request, then saves and reloads the design', async ({
  page,
}, testInfo) => {
  await connected(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const receipts: { ok: boolean }[] = [];
  await page.route('**/__agent/turn/start', async (r) => {
    const { snapshot: s, prompt } = r.request().postDataJSON() as {
      snapshot: Snapshot;
      prompt: string;
    };
    expect(s.coloring?.squareTypes).toContain('square');
    const candidates = s.targets.filter(
      (t) => t.kind === 'polygon' && t.geometry['typeId'] === 'square',
    );
    const distance = (t: (typeof candidates)[number]) => {
      const vertices = t.geometry['vertices'] as { x: number; y: number }[];
      const c = vertices.reduce(
        (a, v) => ({
          x: a.x + v.x / vertices.length,
          y: a.y + v.y / vertices.length,
        }),
        { x: 0, y: 0 },
      );
      return Math.hypot(c.x, c.y);
    };
    const centre = candidates.sort((a, b) => distance(a) - distance(b))[0];
    expect(centre).toBeTruthy();
    const name =
      prompt.includes('Undo') || prompt.includes('Redo')
        ? 'travel_history'
        : 'color_square_bands';
    await r.fulfill({
      json: {
        runId,
        text: '',
        calls: [
          {
            id: 'edit',
            name,
            arguments: {
              snapshotId: s.id,
              documentRevision: s.documentRevision,
              label: prompt,
              ...(name === 'color_square_bands'
                ? { targetId: centre!.id, colors }
                : {
                    direction: prompt.includes('Undo') ? 'undo' : 'redo',
                    scope: 'assistant',
                    steps: 1,
                  }),
            },
          },
        ],
      },
    });
  });
  await page.route('**/__agent/turn/continue', async (r) => {
    const { results, snapshot: s } = r.request().postDataJSON();
    receipts.push(results[0]);
    expect(results[0].ok).toBe(true);
    expect(s.image).toMatch(/^data:image\/png/);
    expect(s.coloring).toBeTruthy();
    await r.fulfill({
      json: { runId, text: 'Checked the actual updated wall.', calls: [] },
    });
  });
  await page.goto('/#/alhambra-arrayanes-squares/result');
  await page.locator('svg.wall').waitFor();
  await page
    .getByRole('button', { name: 'Open drawing assistant', exact: true })
    .click();
  await ask(
    page,
    'Color one black square, teal border to 3×3, blue to 5×5, orange to 7×7; repeat the motif.',
  );
  const bands = page.getByText('Concentric square bands:', { exact: false });
  await expect(bands).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('square-bands.png') });
  for (const color of colors)
    await expect(
      page.locator(`svg.wall polygon[fill="${color}"]`).first(),
    ).toBeAttached();
  await ask(page, 'Undo your last color edit.');
  await expect(bands).toHaveCount(0);
  await ask(page, 'Redo your last color edit.');
  await expect(bands).toBeVisible();
  expect(receipts).toHaveLength(3);
  await page
    .getByRole('button', { name: 'Close drawing assistant', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .first()
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Concentric square test');
  await page
    .locator('form.design-name')
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await expect(page).toHaveURL(/\/design\//);
  await page.reload();
  await expect(bands).toBeVisible();
  for (const color of colors)
    await expect(
      page.locator(`svg.wall polygon[fill="${color}"]`).first(),
    ).toBeAttached();
  expect(errors).toEqual([]);
});

for (const change of ['route', 'manual color', 'Stop'] as const)
  test(`rejects delayed normal coloring after ${change}`, async ({ page }) => {
    await connected(page);
    let release!: () => Promise<void>;
    let observed!: () => void;
    const captured = new Promise<void>((r) => (observed = r));
    await page.route('**/__agent/turn/start', async (r) => {
      const { snapshot: s } = r.request().postDataJSON() as {
        snapshot: Snapshot;
      };
      const centre = s.targets.find(
        (t) => t.kind === 'polygon' && t.geometry['typeId'] === 'square',
      )!;
      await new Promise<void>((resolve) => {
        release = async () => {
          await r
            .fulfill({
              json: {
                runId,
                text: '',
                calls: [
                  {
                    id: 'edit',
                    name: 'color_square_bands',
                    arguments: {
                      snapshotId: s.id,
                      documentRevision: s.documentRevision,
                      targetId: centre.id,
                      colors,
                      label: 'Delayed color',
                    },
                  },
                ],
              },
            })
            .catch(() => undefined);
          resolve();
        };
        observed();
      });
    });
    await page.goto('/#/alhambra-arrayanes-squares/result');
    await page.locator('svg.wall').waitFor();
    await page
      .getByRole('button', { name: 'Open drawing assistant', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'Your request' })
      .fill('Color square borders.');
    await page.getByRole('button', { name: 'Send current view' }).click();
    await captured;
    if (change === 'Stop')
      await page.getByRole('button', { name: 'Stop', exact: true }).click();
    else if (change === 'route')
      await page.evaluate(() => {
        location.hash = '/work';
      });
    else
      await page
        .getByRole('button', { name: 'Fès tile', exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
    await release();
    await expect(
      page.getByRole('button', { name: 'Send current view' }),
    ).toBeEnabled();
    await expect(
      page.getByText('Concentric square bands:', { exact: false }),
    ).toHaveCount(0);
  });
