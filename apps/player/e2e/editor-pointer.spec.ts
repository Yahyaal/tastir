import { expect, test } from '@playwright/test';

test('the editor pointer shows the chosen tool, not the grab hand', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /New pattern/ })
    .first()
    .click();
  const board = page.getByRole('img', { name: 'The construction so far' });
  const cursor = () => board.evaluate((el) => getComputedStyle(el).cursor);
  const tools = page.getByRole('toolbar', { name: 'Tools' });
  await tools.getByRole('button', { name: /Line$/ }).click();
  const ruler = await cursor();
  expect(ruler).toContain('data:image/svg+xml');
  await tools.getByRole('button', { name: /Circle$/ }).click();
  const compass = await cursor();
  expect(compass).toContain('data:image/svg+xml');
  expect(compass).not.toBe(ruler);
});
