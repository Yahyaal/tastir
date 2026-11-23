import type { Page } from '@playwright/test';

/** Opens a tab of Make it yours on the finished wall, when it is there. */
export async function tab(page: Page, name: 'Color' | 'Style' | 'More') {
  // On a phone the panel starts folded: open it first.
  const fold = page.locator('.make-panel.peek .make-title');
  if (await fold.count()) await fold.click();
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
