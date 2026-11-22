import type { Page } from '@playwright/test';

/** Opens a tab of Make it yours on the finished wall, when it is there. */
export async function tab(page: Page, name: 'Colour' | 'Style' | 'More') {
  const button = page.getByRole('tab', { name, exact: true });
  const there = await button.waitFor({ timeout: 3000 }).then(
    () => true,
    () => false,
  );
  if (there && (await button.getAttribute('aria-selected')) !== 'true')
    await button.click();
}

/** The wall styles, in their tab of Make it yours. */
export async function styleGroup(page: Page) {
  await tab(page, 'Style');
  return page.getByRole('group', { name: 'Style', exact: true });
}
