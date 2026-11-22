import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

for (const style of ['Watercolour', 'Screen']) {
  test(`editable JSON restores ${style} and colours in a clean browser`, async ({
    page,
    browser,
  }, info) => {
    await page.goto('/#/eight-fold-star-and-cross/result');
    await page
      .getByRole('button', { name: 'Chefchaouen', exact: true })
      .click();
    await page
      .getByRole('group', { name: 'Style', exact: true })
      .getByRole('button', { name: style, exact: true })
      .click();
    if (style === 'Screen')
      await page.getByRole('button', { name: 'Metal', exact: true }).click();
    // The downloads are in Make it yours' More menu.
    await page.locator('.make-more > summary').click();
    const pending = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name: 'Download pattern file (.json)',
        exact: true,
      })
      .click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(
      'eight-fold-star-and-cross.tastir.json',
    );
    const path = await download.path();
    if (!path) throw new Error('No download');
    const file = JSON.parse(await readFile(path, 'utf8')) as {
      version: number;
      tutorial: { steps: unknown[] };
      design: unknown;
    };
    expect(file.version).toBe(2);
    expect(file.tutorial.steps).toHaveLength(6);
    expect(
      await page.evaluate(() => localStorage.getItem('tastir.patterns')),
    ).toBeNull();
    const other = await browser.newContext({
      viewport: page.viewportSize() ?? { width: 1280, height: 800 },
      reducedMotion: 'reduce',
      isMobile: info.project.name === 'phone',
      hasTouch: info.project.name === 'phone',
    });
    try {
      const recipient = await other.newPage();
      await recipient.goto(new URL('/', page.url()).href);
      await recipient
        .locator('.new-pattern input[type=file]')
        .first()
        .setInputFiles(path);
      await expect(recipient).toHaveURL(/#\/mine\/[^/]+\/design\/[^/]+$/);
      await expect(
        recipient.getByRole('link', { name: 'Edit this pattern', exact: true }),
      ).toHaveAttribute('href', /#\/edit\/[^/]+$/);
      await expect(
        recipient
          .getByRole('group', { name: 'Style', exact: true })
          .getByRole('button', { name: style, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      const kept = await recipient.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tastir.designs') ?? '[]') as Record<
            string,
            unknown
          >[],
      );
      const { name: _name, ...appearance } = file.design as Record<
        string,
        unknown
      >;
      expect(kept[0]).toMatchObject(appearance);
      if (style === 'Watercolour')
        await expect(recipient.locator('svg.wall g.wash')).toHaveCount(1);
      else
        await expect(
          recipient.locator('svg.wall .jali-framework'),
        ).toHaveAttribute('data-material', 'metal');
      await recipient.reload();
      await expect(
        recipient
          .getByRole('group', { name: 'Style', exact: true })
          .getByRole('button', { name: style, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await recipient
        .getByRole('group', { name: 'Style', exact: true })
        .getByRole('button', { name: 'Tiles', exact: true })
        .click();
      await expect(
        recipient.getByRole('button', { name: 'Chefchaouen', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    } finally {
      await other.close();
    }
  });
}
