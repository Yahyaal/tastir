import { expect, test } from '@playwright/test';
const first = 'eight-fold-star-and-cross';
const second = 'six-fold-star-and-hexagons';

test('a newcomer starts the real lesson from the home page and can inspect all twelve', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Start here', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'See the learning path', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/learn$/);
  await expect(page.locator('.learning-card')).toHaveCount(12);
  await expect(
    page.getByText('Historical reference; pattern match unverified', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator('.learning-card')
    .first()
    .getByRole('link', { name: 'Watch this lesson', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(first + '/watch/1$'));
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
});
for (const theme of ['light', 'dark'])
  test(`course reload, previews and layout in ${theme}`, async ({ page }) => {
    await page.addInitScript(
      (theme) =>
        window.localStorage.setItem('tastir.theme', JSON.stringify(theme)),
      theme,
    );
    await page.goto('/#/learn');
    await page.reload();
    await expect(
      page.getByRole('heading', {
        name: 'From one circle to a rosette.',
        exact: true,
      }),
    ).toBeVisible();
    for (const img of await page.locator('.learning-cards img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  });
test('a finished wall offers the next idea and the final pattern offers the path', async ({
  page,
}) => {
  await page.goto(`/#/${first}/result`);
  const next = page.locator('.learning-next');
  await expect(
    next.getByRole('heading', { name: 'Next recommended lesson', exact: true }),
  ).toBeVisible();
  await next.getByRole('link', { name: 'Next lesson', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(second + '/watch/1$'));
  await page.goto('/#/minbar-doors-cairo/result');
  await expect(
    page
      .locator('.learning-next')
      .getByRole('link', { name: 'Review the learning path', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('.learning-next')
      .getByRole('link', { name: 'Next lesson', exact: true }),
  ).toHaveCount(0);
});
test('the next lesson respects a changed saved design and Stay preserves it', async ({
  page,
}) => {
  await page.goto(`/#/${first}/result`);
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Path original');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Chefchaouen', exact: true }).click();
  await page
    .locator('.learning-next')
    .getByRole('link', { name: 'Next lesson', exact: true })
    .click();
  const dialog = page.getByRole('alertdialog', {
    name: 'Unsaved changes',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(page.locator('svg.wall')).toBeVisible();
  await expect(page).toHaveURL(/\/design\//);
});
for (const colorFirst of [false, true])
  test(`a kept draw-along offers the next drawing after ${colorFirst ? 'color then repeat' : 'repeat then color'}`, async ({
    page,
  }) => {
    await page.goto(`/#/${first}/draw`);
    for (let n = 1; n <= 6; n++) {
      await page
        .getByRole('button', { name: 'Draw it for me', exact: true })
        .click();
      await page
        .getByRole('button', { name: n === 6 ? 'Ink it' : 'Next', exact: true })
        .click();
    }
    await expect(page.locator('.learning-next')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Ink it for me', exact: true })
      .click();
    if (colorFirst) {
      await page.getByRole('button', { name: 'Color it', exact: true }).click();
      await page
        .getByRole('button', { name: 'Repeat it', exact: true })
        .click();
    } else
      await page
        .getByRole('button', { name: 'Repeat it', exact: true })
        .click();
    await page
      .getByRole('button', { name: 'Fill the wall for me', exact: true })
      .click();
    if (!colorFirst)
      await page.getByRole('button', { name: 'Color it', exact: true }).click();
    await expect(page.locator('.learning-next')).toHaveCount(0);
    await page.getByRole('button', { name: 'Keep it', exact: true }).click();
    await page
      .locator('.learning-next')
      .getByRole('link', { name: 'Next lesson', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(second + '/draw$'));
    expect(
      await page.evaluate(
        () =>
          JSON.parse(window.localStorage.getItem('tastir.patterns') ?? '[]')
            .length,
      ),
    ).toBe(1);
  });
