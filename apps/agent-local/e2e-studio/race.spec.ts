import { test, expect } from '@playwright/test';
import type { Snapshot } from '@tastir/agent-protocol';
import { externalAgent } from './mcp';

test('an owner edit made during an assistant save remains recoverable', async ({
  page,
}) => {
  const external = await externalAgent();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    const made = await external.call('new_project', {
      title: 'Assistant race',
      fold: 4,
    });
    const project = made.json()['project'] as string;
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
              id: 'circle',
              name: 'apply_steps',
              arguments: {
                snapshotId: snapshot.id,
                documentRevision: snapshot.documentRevision,
                label: 'Assistant circle',
                remove: [],
                steps: [
                  {
                    text: 'Draw the shared circle.',
                    createJson: JSON.stringify({
                      C0: { circle: { centre: 'O', through: 'A' } },
                    }),
                  },
                ],
              },
            },
          ],
        },
      });
    });
    await page.route('**/__agent/turn/continue', (route) =>
      route.fulfill({
        json: {
          runId: '7f232e97-2b78-4ac5-b029-1c365671fdb0',
          text: 'The circle is saved.',
          calls: [],
        },
      }),
    );
    let started!: () => void;
    const saving = new Promise<void>((resolve) => {
      started = resolve;
    });
    await page.route(`**/__studio/projects/${project}/edit`, async (route) => {
      if (route.request().postDataJSON().author === 'tastir-assistant') {
        started();
        await held;
      }
      await route.continue();
    });
    await page.goto(`/#/studio/${project}`);
    const title = page.getByRole('textbox', { name: 'Title', exact: true });
    await expect(title).toHaveValue('Assistant race');
    await page
      .getByRole('button', { name: 'Open drawing assistant', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'Your request' })
      .fill('Add the circle about O through A.');
    await page.getByRole('button', { name: 'Send current view' }).click();
    await saving;
    // A real owner input reaches Editor.save while the assistant request waits.
    await title.fill('My name while saving');
    await title.blur();
    release();
    await expect(
      page.getByRole('heading', { name: 'Your change is kept', exact: true }),
    ).toBeVisible();
    const source = (await external.call('inspect', { project })).json();
    expect(
      (source['drawing'] as { title: string; circles: { name: string }[] })
        .title,
    ).toBe('Assistant race');
    expect(
      (source['drawing'] as { circles: { name: string }[] }).circles.some(
        (circle) => circle.name === 'C0',
      ),
    ).toBe(true);
    await page
      .getByRole('button', { name: 'Close drawing assistant', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Keep mine as a copy', exact: true })
      .click();
    await expect(title).toHaveValue('My name while saving (your version)');
    expect((await external.call('inspect', { project })).json()).toEqual(
      source,
    );
  } finally {
    release();
    await external.close();
  }
});
