import { expect, test, type Locator, type Page } from '@playwright/test';

/** Scrolls the library down and opens the first card in sight. */
async function openACardFarDown(page: Page) {
  await page.goto('/#/');
  await page.locator('.cards .card').first().waitFor();
  // The hero picture above the cards changes height as it loads.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  const href = await page.evaluate(() => {
    const card = [
      ...document.querySelectorAll<HTMLAnchorElement>('.card'),
    ].find((c) => c.getBoundingClientRect().top > 0);
    return card?.getAttribute('href');
  });
  expect(href).toBeTruthy();
  const card = page.locator(`.card[href="${href}"]`);
  // Clicking may scroll the card fully into view: measure after that.
  await card.scrollIntoViewIfNeeded();
  const top = await card.evaluate((c) => c.getBoundingClientRect().top);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await card.click();
  await page.locator('.topbar h1').waitFor();
  return { card, top };
}

/** The card is back at the same height on the screen, and stays there. */
async function expectSamePlace(page: Page, card: Locator, top: number) {
  await page.locator('.cards .card').first().waitFor();
  await page.waitForTimeout(1600);
  const now = await card.evaluate((c) => c.getBoundingClientRect().top);
  expect(Math.abs(now - top)).toBeLessThanOrEqual(1);
}

test('Back returns to the same place in the library', async ({ page }) => {
  const { card, top } = await openACardFarDown(page);
  await page.goBack();
  await expectSamePlace(page, card, top);
});

test('"All patterns" returns to the same place too', async ({ page }) => {
  const { card, top } = await openACardFarDown(page);
  await page.locator('.topbar .home').click();
  await expectSamePlace(page, card, top);
});

test('next and previous follow the filtered library', async ({
  page,
}, info) => {
  // On a phone the patterns before and after are in the Patterns menu.
  test.skip(info.project.name === 'phone');
  await page.goto('/#/');
  await page.getByRole('button', { name: '8-fold', exact: true }).click();
  const ids = await page
    .locator('.cards .card')
    .evaluateAll((cards) => cards.map((c) => c.getAttribute('href')));
  expect(ids.length).toBeGreaterThan(2);
  await page.locator(`.card[href="${ids[0]}"]`).click();
  await expect(
    page.getByRole('link', { name: /^Previous pattern/ }),
  ).toHaveCount(0);
  // A card opens the lesson; next and previous keep watching.
  await page.getByRole('link', { name: /^Next pattern/ }).click();
  await expect(page).toHaveURL(new RegExp(`${ids[1]}$`));
  await page.getByRole('link', { name: /^Previous pattern/ }).click();
  await expect(page).toHaveURL(new RegExp(`${ids[0]}$`));
  // The filter is still on when the learner goes back.
  await page.locator('.topbar .home').click();
  await expect(
    page.getByRole('button', { name: '8-fold', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('the side menu opens another pattern', async ({ page }) => {
  await page.goto('/#/eight-fold-star-and-cross');
  await page.getByRole('button', { name: 'Patterns' }).click();
  const menu = page.getByRole('dialog', { name: 'Patterns' });
  await expect(menu.locator('[aria-current="page"]')).toBeInViewport();
  await menu.getByRole('link', { name: 'Six-fold snowflake' }).click();
  await expect(page).toHaveURL(/#\/six-fold-snowflake\/result$/);
  await expect(menu).toHaveCount(0);
  await expect(page.locator('.topbar h1')).toHaveText('Six-fold snowflake');
  // Escape closes it, and the top bar fits the screen.
  await page.getByRole('button', { name: 'Patterns' }).click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the view switch moves between watching, the result and drawing along', async ({
  page,
}, info) => {
  const phone = info.project.name === 'phone';
  await page.goto('/#/eight-fold-star-and-cross/watch');
  const views = page.getByRole('navigation', {
    name: 'How to see this pattern',
  });
  await views.getByRole('link', { name: 'Result' }).click();
  await expect(page).toHaveURL(/#\/eight-fold-star-and-cross\/result$/);
  await expect(page.locator('svg.wall')).toBeVisible();
  // From a result, the next pattern opens at its result (on a phone,
  // from the Patterns menu, which keeps the view too).
  if (phone) {
    await page.getByRole('button', { name: 'Patterns' }).click();
    await page
      .getByRole('dialog', { name: 'Patterns' })
      .getByRole('link', { name: 'Eight-fold star and octagon' })
      .click();
  } else await page.getByRole('link', { name: /^Next pattern/ }).click();
  await expect(page).toHaveURL(/#\/eight-fold-star-and-octagon\/result$/);
  await expect(page.locator('svg.wall')).toBeVisible();
  await views.getByRole('link', { name: 'Draw along' }).click();
  await expect(page).toHaveURL(/#\/eight-fold-star-and-octagon\/draw$/);
  await views.getByRole('link', { name: 'Result' }).click();
  await expect(page).toHaveURL(/#\/eight-fold-star-and-octagon\/result$/);
  await views.getByRole('link', { name: 'Watch it drawn' }).click();
  await expect(page).toHaveURL(/#\/eight-fold-star-and-octagon\/watch$/);
  await expect(page.locator('svg.wall')).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
