import { expect, test, type Page } from '@playwright/test';

async function pick(page: Page, x: number, y = 0) {
  const svg = page.locator('.along-plate .editor-drawing');
  await svg.scrollIntoViewIfNeeded();
  const at = await svg.evaluate(
    (el: SVGSVGElement, point) => {
      const p = new DOMPoint(point.x, point.y).matrixTransform(
        el.getScreenCTM()!,
      );
      return { x: p.x, y: p.y };
    },
    { x, y },
  );
  if (await page.evaluate(() => navigator.maxTouchPoints > 0))
    await page.touchscreen.tap(at.x, at.y);
  else await page.mouse.click(at.x, at.y);
}

test('the beginner uses A first and is guided from Line to Perpendicular', async ({
  page,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/draw');
  await expect(
    page.getByText(/Choose Circle, (click|tap) O, then A\./),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Circle', exact: true }).click();
  await pick(page, 0);
  await pick(page, 1);
  await expect(
    page.getByRole('button', { name: 'Step 1, on your board', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Line', exact: true }).click();
  await pick(page, 0);
  await pick(page, 1);
  await expect(page.getByText(/Choose Perpendicular\./)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Perpendicular', exact: true }),
  ).toHaveClass(/hinted/);
  await page
    .getByRole('button', { name: 'Perpendicular', exact: true })
    .click();
  await pick(page, 0.4);
  await pick(page, 0);
  await expect(
    page.getByRole('button', { name: 'Step 2, on your board', exact: true }),
  ).toBeVisible();
});

test('construction leads to ink, then Repeat remains reachable', async ({
  page,
}) => {
  await page.goto('/#/eight-fold-star-and-cross/draw');
  for (let n = 1; n <= 6; n++) {
    await page
      .getByRole('button', { name: 'Draw it for me', exact: true })
      .click();
    await expect(
      page.getByRole('button', {
        name: `Step ${n}, on your board`,
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: n === 6 ? 'Ink it' : 'Next', exact: true })
      .click();
  }
  await page
    .getByRole('button', { name: 'Ink it for me', exact: true })
    .click();
  const repeat = page.getByRole('button', { name: 'Repeat it', exact: true });
  await expect(repeat).toBeEnabled();
  await repeat.click();
  await expect(
    page.getByRole('heading', { name: 'Repeat it yourself', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.repeat-board .ghost').first()).toBeVisible();
  const placed = page.locator('.repeat-board .copy-area');
  const before = await placed.count();
  await page.locator('.repeat-board .ghost').first().click();
  await expect(placed).toHaveCount(before + 1);
  await page
    .getByRole('button', { name: 'Fill the wall for me', exact: true })
    .click();
  await page.getByRole('button', { name: 'Color it', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Color it (if you like)', exact: true }),
  ).toBeVisible();
});
