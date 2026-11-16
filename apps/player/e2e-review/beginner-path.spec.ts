import { expect, test } from '@playwright/test';
for (const theme of ['light', 'dark']) {
  test(`path pictures, evidence filters and layout in ${theme}`, async ({
    page,
  }) => {
    await page.addInitScript(
      (theme) =>
        window.localStorage.setItem('tastir.theme', JSON.stringify(theme)),
      theme,
    );
    await page.goto('/#/notes/beginner-path');
    await expect(
      page.getByRole('heading', {
        name: 'From one circle to a rosette.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator('.bp-lesson')).toHaveCount(12);
    await expect(page.locator('.bp-overview img')).toHaveCount(12);
    const before = await page.evaluate(() =>
      window.localStorage.getItem('tastir.lessons'),
    );
    await page
      .getByRole('button', { name: 'Recorded photo matches', exact: true })
      .click();
    await expect(page.locator('.bp-lesson')).toHaveCount(3);
    expect(
      await page
        .locator('.bp-lesson')
        .evaluateAll((els) => els.map((el) => el.getAttribute('value'))),
    ).toEqual(['5', '6', '12']);
    await page
      .getByRole('button', { name: 'Photo work needed', exact: true })
      .click();
    await expect(page.locator('.bp-lesson')).toHaveCount(9);
    await expect(
      page.getByText('Reference photo; match unverified', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'All 12', exact: true }).click();
    for (const image of await page.locator('.bp-lessons img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
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
    expect(
      await page.evaluate(() => window.localStorage.getItem('tastir.lessons')),
    ).toBe(before);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  });
}
test('candidate links open the real paused lesson and the written rationale', async ({
  page,
}) => {
  await page.goto('/#/notes/beginner-path');
  await page
    .locator('#lesson-1')
    .getByRole('link', { name: 'Open step 1', exact: true })
    .click();
  await expect(page).toHaveURL(/eight-fold-star-and-cross\/watch\/1$/);
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page
    .getByRole('link', { name: 'Evidence and selection notes', exact: false })
    .click();
  await expect(page.locator('.notes-doc')).toContainText(
    'This does not yet satisfy the launch gate',
  );
});
