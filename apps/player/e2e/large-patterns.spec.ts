import { expect, test, type Locator, type Page } from '@playwright/test';

async function openStage(page: Page, button: Locator) {
  const start = performance.now();
  await button.click();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return performance.now() - start;
}

for (const id of [
  'bou-inania-rosette',
  'kurt-eight-fold-zellige',
  'kurt-eight-fold-zellige-filled',
  'kurt-eight-fold-zellige-shifted',
]) {
  test(`${id}: stages open promptly while geometry runs in the background`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== 'desktop',
      'Performance is measured on desktop; layout has separate viewport coverage.',
    );
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/#/${id}/draw`);
    await expect(page.locator('.along-grid')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const stages: number[] = [];
    const status = page.locator('.along-check[role="status"]');
    const steps = page.locator('.along-steps button[aria-label^="Step "]');
    for (let i = 0; i < (await steps.count()); i++) {
      stages.push(await openStage(page, steps.nth(i)));
      await expect(status).not.toContainText('Checking');
      const draw = page.getByRole('button', {
        name: 'Draw it for me',
        exact: true,
      });
      if (await draw.isEnabled()) await draw.click();
      await expect(status).not.toContainText('Checking');
    }
    stages.push(
      await openStage(
        page,
        page.getByRole('button', { name: 'Ink', exact: true }),
      ),
    );
    const ink = page.getByRole('button', {
      name: 'Ink it for me',
      exact: true,
    });
    // Preparation is distinct from opening a stage; a cold dense board
    // reports progress while its worker runs and enables ink when ready.
    const prepare = performance.now();
    await expect(ink).toBeEnabled({ timeout: 30_000 });
    const preparationMs = performance.now() - prepare;
    await ink.click();
    const repeat = page.getByRole('button', { name: 'Repeat it', exact: true });
    await expect(repeat).toBeEnabled({ timeout: 30_000 });
    stages.push(await openStage(page, repeat));
    await page
      .getByRole('button', { name: 'Fill the wall for me', exact: true })
      .click();
    stages.push(
      await openStage(
        page,
        page.getByRole('button', { name: 'Color it', exact: true }),
      ),
    );
    await expect(status).not.toContainText('Finding', { timeout: 30_000 });
    expect(errors).toEqual([]);
    console.log(
      `${id}: slowest stage ${Math.round(Math.max(...stages))} ms; ink preparation wait ${Math.round(preparationMs)} ms`,
    );
    expect(Math.max(...stages)).toBeLessThan(1000);
  });
}
