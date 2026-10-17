import { test, expect } from '@playwright/test';
import type { Snapshot } from '@tastir/agent-protocol';
import { externalAgent } from './mcp';

test('owner, assistant and MCP agent share edits, revision checks and authored Undo', async ({
  page,
}, testInfo) => {
  const external = await externalAgent();
  try {
    const made = await external.call('new_project', {
      title: 'Three workers',
      fold: 4,
    });
    expect(made.error).toBe(false);
    const project = made.json()['project'] as string;
    expect(project).toBeTruthy();
    const first = await external.call('construct', {
      project,
      revision: 1,
      command_id: 'external-circle',
      add: [{ kind: 'circle', name: 'C0', centre: 'O', through: 'A' }],
    });
    expect(first.error).toBe(false);
    const beforeAssistant = first.json()['revision'] as number;

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
    await page.route('**/__agent/turn/cancel', (route) =>
      route.fulfill({ json: {} }),
    );
    let refusedUndo = false;
    await page.route('**/__agent/turn/start', async (route) => {
      const { snapshot, prompt } = route.request().postDataJSON() as {
        snapshot: Snapshot;
        prompt: string;
      };
      expect(snapshot.screen?.route).toBe(`studio/${project}`);
      expect(snapshot.editor).toBeTruthy();
      const undo = prompt.startsWith('Undo');
      await route.fulfill({
        json: {
          runId: '7f232e97-2b78-4ac5-b029-1c365671fdb0',
          text: '',
          calls: [
            {
              id: undo ? 'undo' : 'axis',
              name: undo ? 'travel_history' : 'apply_steps',
              arguments: {
                snapshotId: snapshot.id,
                documentRevision: snapshot.documentRevision,
                label: undo ? 'Undo my change' : 'Assistant axis',
                ...(undo
                  ? { direction: 'undo', scope: 'assistant', steps: 1 }
                  : {
                      remove: [],
                      steps: [
                        {
                          text: 'Draw the assistant axis.',
                          createJson: JSON.stringify({
                            AssistantAxis: { line: { through: ['O', 'A'] } },
                          }),
                        },
                      ],
                    }),
              },
            },
          ],
        },
      });
    });
    await page.route('**/__agent/turn/continue', async (route) => {
      const { results, snapshot } = route.request().postDataJSON() as {
        results: { ok: boolean; message: string }[];
        snapshot: Snapshot;
      };
      if (results[0]!.ok) {
        expect(snapshot.image).toMatch(/^data:image\/png/);
        expect(refusedUndo).toBe(false);
      } else {
        expect(results[0]!.message).toMatch(/owner|own changes|manual/i);
        refusedUndo = true;
      }
      await route.fulfill({
        json: {
          runId: '7f232e97-2b78-4ac5-b029-1c365671fdb0',
          text: refusedUndo
            ? 'Your change is protected.'
            : 'The shared axis is saved.',
          calls: [],
        },
      });
    });

    await page.goto(`/#/studio/${project}`);
    const steps = page.getByRole('navigation', { name: 'Steps' });
    await expect(steps).toContainText('Circle C0');
    await page
      .getByRole('button', { name: 'Open drawing assistant', exact: true })
      .click();
    const ask = async (text: string, reply: string) => {
      await page.getByRole('textbox', { name: 'Your request' }).fill(text);
      await page.getByRole('button', { name: 'Send current view' }).click();
      await expect(page.locator('.agent-answer')).toHaveText(reply);
    };
    await ask('Add an axis through O and A.', 'The shared axis is saved.');
    await expect(steps).toContainText('Draw the assistant axis.');
    await page.screenshot({ path: testInfo.outputPath('shared-edit.png') });
    const afterAssistant = await external.call('inspect', { project });
    expect(afterAssistant.error).toBe(false);
    expect(
      (afterAssistant.json()['history'] as { undo: { author: string }[] })
        .undo[0]!.author,
    ).toBe('tastir-assistant');

    await page
      .getByRole('button', { name: 'Close drawing assistant', exact: true })
      .click();
    // The owner makes native geometry with the actual compass tool.
    await page.getByRole('button', { name: 'Compass', exact: true }).click();
    const board = page.locator('[data-tastir-page] .editor-drawing');
    await board.scrollIntoViewIfNeeded();
    for (const x of [1, 0]) {
      const point = await board.evaluate((svg: SVGSVGElement, x) => {
        const at = new DOMPoint(x, 0).matrixTransform(svg.getScreenCTM()!);
        return { x: at.x, y: at.y };
      }, x);
      if (testInfo.project.name === 'phone')
        await page.touchscreen.tap(point.x, point.y);
      else await page.mouse.click(point.x, point.y);
    }
    await expect(steps.locator('ol > li')).toHaveCount(3);
    await expect
      .poll(async () => {
        const view = await external.call('inspect', { project });
        return (view.json()['history'] as { undo: { author: string }[] })
          .undo[0]!.author;
      })
      .toBe('owner');
    const current = (await external.call('inspect', { project })).json();
    const revision = current['revision'] as number;

    const stale = await external.call('construct', {
      project,
      revision: beforeAssistant,
      command_id: 'stale-batch',
      add: [
        { kind: 'line', name: 'MustNotExist', from: 'O', to: 'A' },
        { kind: 'circle', name: 'AlsoMustNotExist', centre: 'A', through: 'O' },
      ],
    });
    expect(stale.error).toBe(true);
    expect(stale.text).toMatch(/changed since revision/);
    const blocked = await external.call('undo', {
      project,
      revision,
      only_mine: true,
      command_id: 'external-undo',
    });
    expect(blocked.error).toBe(true);
    expect(blocked.text).toMatch(/owner/);
    expect((await external.call('inspect', { project })).json()).toEqual(
      current,
    );

    await page
      .getByRole('button', { name: 'Open drawing assistant', exact: true })
      .click();
    await ask('Undo your last change.', 'Your change is protected.');
    expect(refusedUndo).toBe(true);
    expect((await external.call('inspect', { project })).json()).toEqual(
      current,
    );
    await page
      .getByRole('button', { name: 'Close drawing assistant', exact: true })
      .click();
    await page.getByRole('button', { name: 'Undo mine', exact: true }).click();
    await expect(steps.locator('ol > li')).toHaveCount(2);
    const afterOwnerUndo = (await external.call('inspect', { project })).json();
    await page.getByRole('button', { name: 'Undo mine', exact: true }).click();
    await expect(page.getByRole('status').first()).toContainText(
      'made by tastir-assistant',
    );
    expect((await external.call('inspect', { project })).json()).toEqual(
      afterOwnerUndo,
    );
    // The ordinary Undo shortcut still deliberately reaches the latest edit,
    // including the assistant's; only Undo mine imposes the actor boundary.
    await page.keyboard.press('Control+z');
    await expect(steps).not.toContainText('Draw the assistant axis.');
    await expect(steps).toContainText('Circle C0');
  } finally {
    await external.close();
  }
});
