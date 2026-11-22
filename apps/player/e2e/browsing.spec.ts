import { expect, test, type Locator, type Page } from '@playwright/test';

/** The library's cards: each window's picture, a link to its wall. */
const CARDS = '.library-grid .window-link';

/** Scrolls the library down and opens the first card in sight. */
async function openACardFarDown(page: Page) {
  await page.goto('/#/');
  await page.locator(CARDS).first().waitFor();
  // Pictures above the cards change height as they load.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  const href = await page.evaluate(() => {
    const card = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        '.library-grid .window-link',
      ),
    ].find((c) => c.getBoundingClientRect().top > 0);
    return card?.getAttribute('href');
  });
  expect(href).toBeTruthy();
  const card = page.locator(`${CARDS}[href="${href}"]`);
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
  await page.locator(CARDS).first().waitFor();
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
  // The star row of the filters.
  const eightFold = page
    .getByRole('toolbar', { name: 'Filters' })
    .getByRole('button', { name: /^8-fold,/ });
  await eightFold.click();
  const ids = await page
    .locator(CARDS)
    .evaluateAll((cards) => cards.map((c) => c.getAttribute('href')));
  expect(ids.length).toBeGreaterThan(2);
  await page.locator(`${CARDS}[href="${ids[0]}"]`).click();
  await expect(
    page.getByRole('link', { name: /^Previous pattern/ }),
  ).toHaveCount(0);
  // A card opens the result; next and previous keep showing results.
  await page.getByRole('link', { name: /^Next pattern/ }).click();
  await expect(page).toHaveURL(new RegExp(`${ids[1]}(/result)?$`));
  await page.getByRole('link', { name: /^Previous pattern/ }).click();
  await expect(page).toHaveURL(new RegExp(`${ids[0]}(/result)?$`));
  // The filter is still on when the learner goes back.
  await page.locator('.topbar .home').click();
  await expect(eightFold).toHaveAttribute('aria-pressed', 'true');
});

test('the pattern browser opens another pattern', async ({ page }, info) => {
  const docked = info.project.name !== 'phone';
  await page.goto('/#/eight-fold-star-and-cross');
  const toggle = page.getByRole('button', { name: 'Patterns', exact: true });
  await toggle.click();
  const menu = page.getByRole(docked ? 'complementary' : 'dialog', {
    name: 'Patterns',
  });
  await expect(menu.locator('[aria-current="page"]')).toBeInViewport();
  await menu.getByRole('link', { name: 'Six-fold snowflake' }).click();
  await expect(page).toHaveURL(/#\/six-fold-snowflake\/result$/);
  await expect(page.locator('.topbar h1')).toHaveText('Six-fold snowflake');
  if (docked) {
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole('link', { name: 'Six-fold snowflake' }),
    ).toHaveAttribute('aria-current', 'page');
    await toggle.click();
  }
  await expect(menu).toHaveCount(0);
  await toggle.click();
  if (docked)
    await menu
      .getByRole('button', { name: 'Close the list of patterns' })
      .focus();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(toggle).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
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
  await expect(page).toHaveURL(/#\/eight-fold-star-and-octagon\/watch\/\d+$/);
  await expect(page.locator('svg.wall')).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the variations of a pattern switch at the same stage', async ({
  page,
}) => {
  await page.goto('/#/');
  // The library shows the family once, counting its variations.
  const card = page.locator(`${CARDS}[href="#/alhambra-star-and-arrows"]`);
  await expect(
    page
      .locator('.library-grid .window', {
        has: page.locator('.window-link[href="#/alhambra-star-and-arrows"]'),
      })
      .locator('.window-badge'),
  ).toHaveText('2 designs');
  await expect(
    page.locator(`${CARDS}[href="#/alhambra-star-and-arrows-shifted"]`),
  ).toHaveCount(0);
  await card.click();
  const switcher = page.getByRole('navigation', {
    name: 'Variations of this pattern',
  });
  await expect(switcher).toBeVisible();
  // It fits on the screen, phones included.
  const box = await switcher.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect((box?.x ?? -1) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
  await expect(
    switcher.getByRole('link', {
      name: 'Alhambra star and arrows',
      exact: true,
    }),
  ).toHaveAttribute('aria-current', 'page');
  await switcher
    .getByRole('link', { name: 'Alhambra star and arrows, shifted rows' })
    .click();
  await expect(page).toHaveURL(/alhambra-star-and-arrows-shifted\/result$/);
  await expect(
    switcher.getByRole('link', {
      name: 'Alhambra star and arrows, shifted rows',
    }),
  ).toHaveAttribute('aria-current', 'page');
});

test('a place on the route counts its cards, and Back shows all again', async ({
  page,
}) => {
  await page.goto('/#/');
  const all = await page.locator(CARDS).count();
  const stop = page
    .locator('.route .route-stop')
    .filter({ hasText: 'Alhambra' });
  const count = Number(
    (await stop.locator('small').textContent())?.match(/\d+/)?.[0],
  );
  expect(count).toBeGreaterThan(0);
  await stop.locator('.route-dot').click();
  await expect(page).toHaveURL(/#\/places\/Alhambra%20and%20Nasrid%20Spain$/);
  await expect(page.locator(CARDS)).toHaveCount(count);
  await expect(
    page.getByRole('heading', { name: /^Alhambra/, level: 2 }),
  ).toBeVisible();
  // The place's traditions, as chips under its heading.
  await expect(
    page.getByRole('group', { name: 'Traditions' }).getByRole('button', {
      name: /^Nasrid,/,
    }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator(CARDS)).toHaveCount(all);
  // Pattern books is a place of its own, in the heading.
  await page.getByRole('link', { name: /^Pattern books/ }).click();
  await expect(page).toHaveURL(/#\/places\/Books%20and%20other$/);
  await page.getByRole('link', { name: /^Back to all places/ }).click();
  await expect(page.locator(CARDS)).toHaveCount(all);
});

test('the title stays centered at both ends of the library', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'phone',
    'Phone pattern browsing uses the side menu.',
  );
  await page.goto('/#collection');
  const cards = page.locator(CARDS);
  await cards.first().waitFor();
  const first = await cards.first().getAttribute('href');
  const last = await cards.last().getAttribute('href');
  for (const [href, missing] of [
    [first, 'previous'],
    [last, 'next'],
  ] as const) {
    await page.goto('/' + href!);
    const heading = page.locator('.pattern-heading');
    await expect(heading.locator('.lesson-title h1')).toBeVisible();
    await expect(heading.locator('.' + missing)).toHaveCount(0);
    const offset = await heading.evaluate((element) => {
      const frame = element.getBoundingClientRect();
      const title = element
        .querySelector('.lesson-title')!
        .getBoundingClientRect();
      return Math.abs(
        (title.left + title.right) / 2 - (frame.left + frame.right) / 2,
      );
    });
    expect(offset).toBeLessThan(1);
  }
});

test('a place address opens the library on that place', async ({ page }) => {
  // #/places/<place> (REDESIGN.2): a place can be shared as a link.
  await page.goto('/#/places/Iran');
  await expect(
    page.getByRole('heading', { name: /^Iran/, level: 2 }),
  ).toBeVisible();
  await expect(
    page.locator('.route .route-stop[aria-current="page"]'),
  ).toContainText('Iran');
  await page.goto('/#/places/Atlantis');
  await expect(page.locator('.library')).toBeVisible();
});
