import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import type { Snapshot } from '@tastir/agent-protocol';
import { externalAgent } from './mcp';

const green = '#12ab34';
async function greenPixels(image: Buffer) {
  const { data, info } = await sharp(image)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels)
    if (
      Math.abs(data[i]! - 18) < 3 &&
      Math.abs(data[i + 1]! - 171) < 3 &&
      Math.abs(data[i + 2]! - 52) < 3
    )
      count++;
  return count;
}

test('a shared colored drawing saves as a named copy, reloads and exports faithfully', async ({
  page,
}, testInfo) => {
  const external = await externalAgent();
  try {
    const made = await external.call('new_project', {
      title: 'Shared colored source',
      fold: 4,
    });
    expect(made.error).toBe(false);
    const project = made.json()['project'] as string;
    let built = await external.call('construct', {
      project,
      revision: 1,
      command_id: 'square-construction',
      add: [
        { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
        { kind: 'line', name: 'L0', from: 'O', to: 'A' },
        {
          kind: 'intersection',
          name: 'W',
          first: 'L0',
          second: 'C0',
          angle: 180,
        },
        { kind: 'circle', name: 'C1', centre: 'A', through: 'W' },
        { kind: 'circle', name: 'C2', centre: 'W', through: 'A' },
        {
          kind: 'intersection',
          name: 'T',
          first: 'C1',
          second: 'C2',
          angle: 90,
        },
        {
          kind: 'intersection',
          name: 'B',
          first: 'C1',
          second: 'C2',
          angle: 270,
        },
        { kind: 'line', name: 'Axis', from: 'T', to: 'B' },
        {
          kind: 'intersection',
          name: 'N',
          first: 'Axis',
          second: 'C0',
          angle: 90,
        },
        {
          kind: 'intersection',
          name: 'S',
          first: 'Axis',
          second: 'C0',
          angle: 270,
        },
      ],
    });
    expect(built.error).toBe(false);
    built = await external.call('ink', {
      project,
      revision: built.json()['revision'],
      command_id: 'square-ink',
      add: [
        { from: 'A', to: 'N' },
        { from: 'N', to: 'W' },
        { from: 'W', to: 'S' },
        { from: 'S', to: 'A' },
      ],
    });
    expect(built.error).toBe(false);
    built = await external.call('set_tile', {
      project,
      revision: built.json()['revision'],
      command_id: 'square-tile',
      vertices: ['A', 'N', 'W', 'S'],
    });
    expect(built.error).toBe(false);
    const view = (await external.call('inspect', { project })).json();
    const drawing = view['drawing'] as { tile: { pieces: { id: string }[] } };
    expect(drawing.tile.pieces.length).toBeGreaterThan(0);
    const painted = await external.call('paint', {
      project,
      revision: view['revision'],
      command_id: 'paint-green',
      colors: [{ piece: drawing.tile.pieces[0]!.id, color: green }],
    });
    expect(painted.error).toBe(false);
    const picture = await external.call('view', { project, what: 'wall' });
    expect(picture.error).toBe(false);
    expect(picture.text).toContain("not the owner's screen");
    const serverImage = Buffer.from(
      picture.content.find((item) => item.type === 'image')!.data!,
      'base64',
    );
    expect(await greenPixels(serverImage)).toBeGreaterThan(20);
    await writeFile(testInfo.outputPath('server-wall.png'), serverImage);
    await testInfo.attach('server-wall', {
      body: serverImage,
      contentType: 'image/png',
    });

    await page.route('**/__agent/status', (route) =>
      route.fulfill({
        json: {
          profiles: [
            { id: 'mock', label: 'Simulated account', connected: true },
          ],
          activeId: 'mock',
          connected: true,
          sharing: true,
          signingIn: false,
          error: null,
        },
      }),
    );
    await page.route('**/__agent/models', (route) =>
      route.fulfill({ json: [{ slug: 'mock', name: 'Simulated model' }] }),
    );
    await page.route('**/__agent/turn/start', async (route) => {
      const { snapshot } = route.request().postDataJSON() as {
        snapshot: Snapshot;
      };
      await route.fulfill({
        json: {
          runId: '7f232e97-2b78-4ac5-b029-1c365671fdb0',
          text: '',
          calls: [
            {
              id: 'save-copy',
              name: 'save_work',
              arguments: {
                snapshotId: snapshot.id,
                documentRevision: snapshot.documentRevision,
                label: 'Keep named copy',
                name: 'My shared green copy',
              },
            },
          ],
        },
      });
    });
    await page.route('**/__agent/turn/continue', async (route) => {
      expect(route.request().postDataJSON().results[0].ok).toBe(true);
      await route.fulfill({
        json: {
          runId: '7f232e97-2b78-4ac5-b029-1c365671fdb0',
          text: 'Your named copy is saved.',
          calls: [],
        },
      });
    });
    await page.goto(`/#/studio/${project}`);
    await expect(
      page.getByRole('textbox', { name: 'Title', exact: true }),
    ).toHaveValue('Shared colored source');
    await page
      .getByRole('button', { name: 'Open drawing assistant', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'Your request' })
      .fill('Save a copy named My shared green copy.');
    await page.getByRole('button', { name: 'Send current view' }).click();
    await expect(page.locator('.agent-answer')).toHaveText(
      'Your named copy is saved.',
    );
    const copy = await page.evaluate(() => {
      const items = JSON.parse(
        localStorage.getItem('tastir.patterns') ?? '[]',
      ) as { id: string; tutorial: { title: string; pattern: unknown } }[];
      return items.find(
        (item) => item.tutorial.title === 'My shared green copy',
      )!;
    });
    expect(copy).toBeTruthy();
    expect(JSON.stringify(copy.tutorial.pattern)).toContain(green);
    expect((await external.call('inspect', { project })).json()).toEqual(
      painted.json(),
    );

    await page.goto(`/#/edit/${copy.id}`);
    await page.reload();
    await expect(
      page.getByRole('textbox', { name: 'Title', exact: true }),
    ).toHaveValue('My shared green copy');
    await page
      .getByRole('button', { name: 'About the pattern', exact: true })
      .click();
    const downloading = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Download the tutorial file', exact: true })
      .click();
    const downloaded = await downloading;
    const exported = JSON.parse(
      await readFile((await downloaded.path())!, 'utf8'),
    ) as { title: string; pattern: unknown };
    expect(exported.title).toBe('My shared green copy');
    expect(JSON.stringify(exported.pattern)).toContain(green);
    await page.getByRole('link', { name: '▶ Play', exact: true }).click();
    await expect(page.locator('svg.wall')).toBeVisible();
    await expect(
      page.locator(`svg.wall polygon[fill="${green}"]`).first(),
    ).toBeAttached();
    const browserImage = await page
      .locator('svg.wall')
      .screenshot({ path: testInfo.outputPath('browser-wall.png') });
    expect(await greenPixels(browserImage)).toBeGreaterThan(20);
    await testInfo.attach('browser-wall', {
      body: browserImage,
      contentType: 'image/png',
    });
  } finally {
    await external.close();
  }
});
