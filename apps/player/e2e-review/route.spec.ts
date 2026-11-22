import { expect, test, type Page } from '@playwright/test';

// REDESIGN.2's acceptance test: every place can be chosen by clicking its
// stretch, its dot or with the keyboard, and Back returns to all places.
const PLACES = [
  ['Spain and Portugal, other', 'Spain & Portugal'],
  ['Alhambra and Nasrid Spain', 'Alhambra'],
  ['Morocco', 'Morocco'],
  ['Algeria and Tunisia', 'Algeria & Tunisia'],
  ['Egypt, Syria and Iraq', 'Egypt, Syria & Iraq'],
  ['Turkey', 'Turkey'],
  ['Iran', 'Iran'],
  ['Central Asia', 'Central Asia'],
  ['India', 'India'],
] as const;

const route = (page: Page) => page.locator('.route-review > .route');
const status = (page: Page) => page.locator('.route-review-chosen');

async function chosen(page: Page, key: string, short: string) {
  await expect(page).toHaveURL(
    new RegExp(`#/review/route/${encodeURIComponent(key)}$`),
  );
  await expect(route(page).locator('[aria-current="page"]')).toHaveCount(1);
  await expect(
    route(page).locator('.route-stop[aria-current="page"] b'),
  ).toHaveText(short);
  await expect(status(page)).toContainText(`Showing ${short}`);
}

async function backToAll(page: Page) {
  await page.goBack();
  await expect(page).toHaveURL(/#\/review\/route$/);
  await expect(route(page).locator('[aria-current="page"]')).toHaveCount(0);
  await expect(status(page)).toContainText('Showing all places');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/review/route');
  await expect(
    page.getByRole('heading', { name: 'The route', exact: true }),
  ).toBeVisible();
});

test('every place is chosen by a click on its stretch', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [i, [key, short]] of PLACES.entries()) {
    const zone = route(page).locator(`.route-zone[data-place="${key}"]`);
    const box = await zone.boundingBox();
    expect(box).not.toBeNull();
    // Away from the dot and from every name: near the stretch's west end,
    // above the route for a low stop, and between the line and the low
    // names for a high one (names go above high stops, below low ones).
    const high = i % 2 === 1;
    const h = box?.height ?? 100;
    await zone.click({ position: { x: 6, y: high ? h * 0.56 : 6 } });
    await chosen(page, key, short);
    await backToAll(page);
  }
  expect(errors).toEqual([]);
});

test('every place is chosen by its dot, and again shows all', async ({
  page,
}) => {
  for (const [key, short] of PLACES) {
    await route(page)
      .locator('.route-stop')
      .filter({ hasText: short })
      .locator('.route-dot')
      .click();
    await chosen(page, key, short);
    // Choosing the chosen place again shows all places.
    await route(page)
      .locator('.route-stop[aria-current="page"] .route-dot')
      .click();
    await expect(page).toHaveURL(/#\/review\/route$/);
    await expect(route(page).locator('[aria-current="page"]')).toHaveCount(0);
    await page.goBack();
    await chosen(page, key, short);
    await backToAll(page);
  }
});

test('every place is chosen with the keyboard', async ({ page }) => {
  // Tab from the top bar's last link onto the first stop, then on.
  await page.locator('.review-top a').last().focus();
  for (const [key, short] of PLACES) {
    await page.keyboard.press('Tab');
    const stop = route(page).locator('.route-stop').filter({ hasText: short });
    await expect(stop).toBeFocused();
    await page.keyboard.press('Enter');
    await chosen(page, key, short);
    await backToAll(page);
    await stop.focus();
  }
});

test('the band, the light and dark routes, and the slim line', async ({
  page,
}, info) => {
  // The band picture loads, the light one in a light panel and the dark
  // one in a dark panel.
  for (const theme of ['light', 'dark']) {
    const img = page.locator(
      `.route-review-panel[data-theme="${theme}"] .route-band-${theme}`,
    );
    await expect(img).toBeVisible();
    await expect
      .poll(() =>
        img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(
      page.locator(
        `.route-review-panel[data-theme="${theme}"] .route-band-${theme === 'light' ? 'dark' : 'light'}`,
      ),
    ).toBeHidden();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath('route.png'), fullPage: true });
  const height = () =>
    route(page)
      .locator('.route-in')
      .evaluate((el) => el.getBoundingClientRect().height);
  const tall = await height();
  await page.mouse.wheel(0, 900);
  await expect(route(page)).toHaveClass(/is-slim/);
  if (info.project.name === 'phone') {
    // On a phone it does not stick, so it keeps its size.
    expect(await height()).toBe(tall);
    // On a phone the route is a row that scrolls sideways.
    const nav = route(page);
    expect(await nav.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
  } else {
    // On a computer it shrinks and stays at the top as the page scrolls.
    await expect.poll(height).toBeLessThan(tall);
    expect((await route(page).boundingBox())?.y).toBeLessThan(2);
  }
  await route(page).screenshot({ path: info.outputPath('slim.png') });
});

test('#/places/<place> opens the library on that place', async ({ page }) => {
  await page.goto('/#/places/Morocco');
  await expect(
    page.getByRole('button', { name: 'Remove the filter Morocco' }),
  ).toBeAttached();
});
