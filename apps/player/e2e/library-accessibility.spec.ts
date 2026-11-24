import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`library semantics and responsive previews in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: 'no-preference',
      colorScheme: theme,
    });
    await page.goto('/');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(
      page.getByRole('navigation', { name: 'Places, west to east' }),
    ).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Filters' })).toBeVisible();
    await expect(
      page.getByRole('searchbox', { name: 'Search patterns' }),
    ).toBeVisible();
    // Tab reaches a window's View, and its three buttons show.
    const first = page.locator('.library-grid .window').first();
    await first.getByRole('link', { name: /^View / }).focus();
    await expect(first.locator('.window-actions')).toHaveCSS('opacity', '1');
    await expect(first.locator('.window-dots')).toHaveAttribute('role', 'img');
    const image = page.locator('.library-grid .window-pic img').first();
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute('srcset', /320w, .*480w/);
    await expect
      .poll(() =>
        image.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const selector of ['.window-meta', '.window-note']) {
      const ratios = await page.locator(selector).evaluateAll((elements) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d')!;
        const luminance = () => {
          const rgb = context.getImageData(0, 0, 1, 1).data;
          return [0.2126, 0.7152, 0.0722].reduce((sum, weight, i) => {
            const c = rgb[i] / 255;
            return (
              sum +
              weight * (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
            );
          }, 0);
        };
        return elements.map((element) => {
          const style = window.getComputedStyle(element);
          context.fillStyle = style.getPropertyValue('--theme-bg-card');
          context.fillRect(0, 0, 1, 1);
          context.fillStyle = style.backgroundColor;
          context.fillRect(0, 0, 1, 1);
          const background = luminance();
          context.fillStyle = style.color;
          context.fillRect(0, 0, 1, 1);
          const foreground = luminance();
          return (
            (Math.max(background, foreground) + 0.05) /
            (Math.min(background, foreground) + 0.05)
          );
        });
      });
      expect(ratios.length).toBeGreaterThan(0);
      expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
