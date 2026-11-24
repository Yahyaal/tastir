import { expect, test } from '@playwright/test';

test('show/hide browser reserves canvas space on wide screens and uses a drawer on phones', async ({
  page,
}, info) => {
  const docked = info.project.name !== 'phone';
  await page.goto('/#/eight-fold-star-and-cross/result');
  const toggle = page.getByRole('button', { name: 'Patterns', exact: true });
  const before = await page.locator('.stage').boundingBox();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const browser = page.getByRole(docked ? 'complementary' : 'dialog', {
    name: 'Patterns',
  });
  await expect(browser).toBeVisible();
  if (docked) {
    await expect(page.locator('.pattern-menu-backdrop')).toHaveCount(0);
    const panel = await browser.boundingBox();
    const canvas = await page.locator('.stage').boundingBox();
    expect(canvas!.x).toBeGreaterThanOrEqual(panel!.x + panel!.width);
    expect(canvas!.width).toBeGreaterThan(250);
    expect(canvas!.width).toBeLessThan(before!.width);
    await page.getByLabel('Settings', { exact: true }).click();
    await page
      .getByRole('button', { name: 'Close settings', exact: true })
      .click();
    await toggle.click();
  } else {
    await expect(browser).toHaveAttribute('aria-modal', 'true');
    await browser
      .getByRole('button', { name: 'Close the list of patterns' })
      .click();
  }
  await expect(browser).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  const after = await page.locator('.stage').boundingBox();
  expect(Math.abs(after!.width - before!.width)).toBeLessThan(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('browsing with unsaved work still offers Stay without changing the design', async ({
  page,
}, info) => {
  const docked = info.project.name !== 'phone';
  await page.goto('/#/eight-fold-star-and-cross/result');
  await page.getByRole('button', { name: /^Save( as my design)?$/ }).click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Sidebar original');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Chefchaouen', exact: true }).click();
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await page
    .getByRole(docked ? 'complementary' : 'dialog', { name: 'Patterns' })
    .getByRole('link', { name: 'Six-fold snowflake' })
    .click();
  const warning = page.getByRole('alertdialog', { name: 'Unsaved changes' });
  await expect(warning).toBeVisible();
  await warning.getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(page).toHaveURL(/eight-fold-star-and-cross\/design\//);
  await expect(page.locator('svg.wall')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Chefchaouen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('the pattern menu searches the library from any pattern', async ({
  page,
}, info) => {
  const docked = info.project.name !== 'phone';
  await page.goto('/#/eight-fold-star-and-cross/result');
  const toggle = page.getByRole('button', { name: 'Patterns', exact: true });
  await toggle.click();
  const browser = page.getByRole(docked ? 'complementary' : 'dialog', {
    name: 'Patterns',
  });
  const search = browser.getByRole('searchbox', { name: 'Search patterns' });
  const links = browser.getByRole('link');
  const all = await links.count();
  await search.fill('Comares');
  await expect(
    browser.getByRole('link', { name: /Comares west dado/ }),
  ).toBeVisible();
  expect(await links.count()).toBeLessThan(all);
  await search.fill('zzqx');
  await expect(browser.getByRole('status')).toHaveText(/No patterns match/);
  await expect(links).toHaveCount(0);
  // Escape empties the search first, and the menu stays open.
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(browser).toBeVisible();
  await expect(links).toHaveCount(all);
  await search.fill('Comares');
  await browser.getByRole('link', { name: /Comares west dado/ }).click();
  await expect(page).toHaveURL(/alhambra-comares-west-dado\/result/);
});
