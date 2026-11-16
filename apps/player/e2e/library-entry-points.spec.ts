import { expect, test } from '@playwright/test';

for (const hash of ['#collection', '#/collection', '#%63ollection']) {
  test(`direct ${hash} opens and focuses the collection`, async ({ page }) => {
    await page.goto(`/${hash}`);
    const heading = page.getByRole('heading', {
      name: 'The patterns',
      exact: true,
    });
    await expect(heading).toBeFocused();
    await expect(page.getByText(/There is no tutorial called/)).toHaveCount(0);
    await expect(page.locator('.cards .card').first()).toBeVisible();
    await page.reload();
    await expect(heading).toBeFocused();
  });
}

test('Arabic, mixed-script and point-count searches narrow the actual library', async ({
  page,
}) => {
  await page.goto('/#collection');
  const search = page.getByRole('searchbox', { name: 'Search patterns' });
  const cards = page.locator('.cards .card');
  await cards.first().waitFor();
  const all = await cards.count();
  const ids = () =>
    cards.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  await search.fill('star');
  const stars = await ids();
  expect(stars.length).toBeGreaterThan(0);
  expect(stars.length).toBeLessThan(all);
  await search.fill('نَجْمَة');
  expect(await ids()).toEqual(stars);
  expect(
    await search.evaluate((n) => window.getComputedStyle(n).direction),
  ).toBe('rtl');
  await search.fill('star Fez');
  const fez = await ids();
  expect(fez.length).toBeGreaterThan(0);
  expect(fez.length).toBeLessThan(stars.length);
  await search.fill('نجمة فاس');
  expect(await ids()).toEqual(fez);
  await search.fill('16 point');
  const sixteen = await ids();
  await search.fill('١٦ نقطة');
  expect(await ids()).toEqual(sixteen);
  await search.fill('كلمةلاتوجدفيالفهرس');
  await expect(cards).toHaveCount(0);
  await search.fill('不存在');
  await expect(cards).toHaveCount(0);
  console.log(
    JSON.stringify({
      all,
      stars: stars.length,
      arabicStars: stars.length,
      fezStars: fez.length,
      sixteenPoint: sixteen.length,
      unknown: 0,
    }),
  );
});

test('Back from a tutorial preserves the library position when entered through the collection anchor', async ({
  page,
}) => {
  await page.goto('/#collection');
  await page.locator('.cards .card').first().waitFor();
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  const href = await page
    .locator('.cards .card')
    .evaluateAll((nodes) =>
      nodes
        .find((n) => n.getBoundingClientRect().top > 0)
        ?.getAttribute('href'),
    );
  if (!href) throw new Error('No card in view');
  const card = page.locator(`.cards .card[href="${href}"]`);
  await card.scrollIntoViewIfNeeded();
  const top = await card.evaluate((n) => n.getBoundingClientRect().top);
  await card.click();
  await page.locator('.topbar h1').waitFor();
  await page.goBack();
  await card.waitFor();
  await page.waitForTimeout(1600);
  const back = await card.evaluate((n) => n.getBoundingClientRect().top);
  expect(Math.abs(back - top)).toBeLessThanOrEqual(1);
});
