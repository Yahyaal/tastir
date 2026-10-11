import { expect, test, type Page } from '@playwright/test';

/** The along work measured in the page since the last call, by name. */
async function measures(page: Page): Promise<Record<string, number[]>> {
  return page.evaluate(() => {
    const out: Record<string, number[]> = {};
    for (const m of performance.getEntriesByType('measure'))
      if (m.name.startsWith('along:'))
        (out[m.name.slice(6)] ??= []).push(Math.round(m.duration));
    performance.clearMeasures();
    return out;
  });
}

for (const id of [
  'bou-inania-rosette',
  'bou-inania-twelve-fold-wall',
  'kurt-eight-fold-zellige-shifted',
]) {
  test(`${id}: the pen is ready soon after Ink is pressed`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== 'desktop',
      'Speed is measured on desktop; layout has separate viewport coverage.',
    );
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/#/${id}/draw`);
    await expect(page.locator('.along-grid')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const status = page.locator('.along-check[role="status"]');
    const steps = page.locator('.along-steps button[aria-label^="Step "]');
    for (let i = 0; i < (await steps.count()); i++) {
      await steps.nth(i).click();
      await expect(status).not.toContainText('Checking', { timeout: 30_000 });
      const draw = page.getByRole('button', {
        name: 'Draw it for me',
        exact: true,
      });
      if (await draw.isEnabled()) await draw.click();
      await expect(status).not.toContainText('Checking', { timeout: 30_000 });
    }
    await measures(page);
    // The learner presses Ink as soon as the last step is checked: from
    // the click to a pen that works.
    const ink = page.getByRole('button', {
      name: 'Ink it for me',
      exact: true,
    });
    const start = Date.now();
    await page.getByRole('button', { name: 'Ink', exact: true }).click();
    await expect(ink).toBeEnabled({ timeout: 60_000 });
    const readyMs = Date.now() - start;
    const preparing = await measures(page);
    // Inking the whole tile, to the check that lets them repeat it.
    const inked = Date.now();
    await ink.click();
    const repeat = page.getByRole('button', { name: 'Repeat it', exact: true });
    await expect(repeat).toBeEnabled({ timeout: 60_000 });
    const checkMs = Date.now() - inked;
    const checking = await measures(page);
    expect(errors).toEqual([]);
    console.log(
      `${id}: Ink to pen ${readyMs} ms; Ink it for me to Repeat ${checkMs} ms\n` +
        `  preparing ${JSON.stringify(preparing)}\n` +
        `  checking ${JSON.stringify(checking)}`,
    );
  });
}
