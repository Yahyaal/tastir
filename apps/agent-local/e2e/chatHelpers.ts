import type { Page } from '@playwright/test';

/** Chat starts empty; older tool scenarios explicitly submit their test request. */
export async function prepareRequest(page: Page) {
  const input = page.getByRole('textbox', { name: 'Your request' });
  if (!(await input.inputValue()).trim())
    await input.fill('Continue with the current pattern request.');
}
export async function sendCurrentView(page: Page) {
  await prepareRequest(page);
  await page.getByRole('button', { name: 'Send current view' }).click();
}
