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
    const progress = page.getByRole('progressbar', {
      name: 'Pattern drawing progress',
    });
    await expect(progress).toHaveAttribute('aria-valuemin', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', '100');
    await expect(page.locator('.hero-color-chip').first()).toHaveAttribute(
      'role',
      'img',
    );
    const image = page.locator('img.thumbnail').first();
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
    for (const selector of ['.level-intermediate', '.verification-label']) {
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
