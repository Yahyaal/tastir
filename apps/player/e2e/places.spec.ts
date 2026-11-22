import { expect, test } from '@playwright/test';

const places = [
  ['ben-youssef-star-rosettes', 'Ben Youssef star rosettes'],
  ['seville-vanda-star-rosettes', 'Seville V&A'],
  ['leon-mosaic-star-rosettes', 'Alberto Leon'],
  ['ismail-shrine-divided-stars', 'Imamzadeh Ismail divided stars'],
  ['alhambra-museum-loops', 'Alhambra Museum loops'],
  ['alhambra-comares-stars', 'Comares stars'],
  ['mashhad-gowhar-interlace', 'Gowhar Shad'],
  ['hani-zeynebiye-stars', 'Hani Zeynebiye'],
  ['itimad-daula-stars', 'Itimad al-Daula'],
  ['mexuar-twelve-star-bands', 'Mexuar star bands'],
] as const;

test('each merged place is found at its own address by name', async ({
  page,
}) => {
  await page.goto('/#/');
  for (const [id, query] of places) {
    await page.getByRole('searchbox').fill(query);
    await expect(
      page.locator(`a.window-link[href^="#/${id}"]`).first(),
    ).toBeVisible();
  }
});

for (const [id] of places) {
  test(`${id}: direct, shared and saved designs preserve the place`, async ({
    page,
  }) => {
    // Exercise the fallback link without writing to the system clipboard.
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => {
            throw new Error('Clipboard disabled for this isolated test');
          },
        },
      }),
    );
    await page.goto(`/#/${id}/result`);
    const title = page.locator('.lesson-title h1');
    await expect(title).toBeVisible();
    const originalTitle = await title.getAttribute('title');
    expect(originalTitle).toBeTruthy();
    await expect(
      page
        .getByRole('navigation', { name: 'Places this pattern is found' })
        .locator('[aria-current="page"]'),
    ).toHaveAttribute('href', `#/${id}/result`);

    await page
      .getByRole('button', { name: 'Copy a share link', exact: true })
      .first()
      .click();
    const link = await page
      .getByRole('textbox', { name: 'Share link', exact: true })
      .inputValue();
    await page.goto(link);
    await expect(
      page.getByRole('button', {
        name: 'Keep a copy in this browser',
        exact: true,
      }),
    ).toBeVisible();
    await expect(title).toHaveAttribute('title', originalTitle ?? '');

    await page.goto(`/#/${id}/result`);
    await page
      .getByRole('button', { name: 'Save as my design', exact: true })
      .first()
      .click();
    const name = `Place audit: ${id}`;
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page
      .locator('.design-name')
      .getByRole('button', { name: 'Save', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#/${id}/design/`));
    await page.reload();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    await expect(title).toHaveAttribute('title', originalTitle ?? '');
  });
}
