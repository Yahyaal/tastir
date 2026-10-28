import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const pattern = 'eight-fold-star-and-cross';
const reportButton = (page: Page) =>
  page.getByRole('button', {
    name: 'Report an issue or leave feedback',
    exact: true,
  });
async function fakeVerification(page: Page) {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile={render:function(el,options){setTimeout(function(){options.callback('fixture-feedback-token')},10);return 'widget'},remove:function(){}};`,
      }),
  );
}
async function openReport(page: Page) {
  await page.goto(`/#/${pattern}/draw`);
  await expect(reportButton(page)).toBeVisible();
  await reportButton(page).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function signIn(page: Page) {
  await page.goto('/#/studio');
  await page.getByRole('link', { name: 'Sign in with Google' }).click();
  await expect(
    page.getByRole('heading', { name: 'Studio', exact: true }),
  ).toBeVisible();
}

test('anonymous learner sends a contextual drawing report; owner reviews and exports selected evidence', async ({
  page,
}, info) => {
  await fakeVerification(page);
  await openReport(page);
  const message = `Drawing problem ${info.project.name}: the line through B does not finish.`;
  await page
    .getByLabel('What happened, or what would you like to tell us?')
    .fill(message);
  await page
    .getByLabel('Email, if you would like a reply (optional)')
    .fill('learner-private@example.invalid');
  await page
    .getByLabel('Include my current drawing and editable drawing data')
    .check();
  await expect(
    page.getByAltText('Your board at the reported step'),
  ).toBeVisible();
  await mkdir('docs/review/feedback', { recursive: true });
  await page.screenshot({
    path: `docs/review/feedback/${info.project.name}-form-light.png`,
  });
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
  await page.screenshot({
    path: `docs/review/feedback/${info.project.name}-form-dark.png`,
  });
  await page
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  await expect(
    page.getByText('Thanks — your feedback was sent.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close feedback' }).click();
  expect((await page.request.get('/api/owner/feedback')).status()).toBe(401);
  await signIn(page);
  await page.goto('/#/feedback');
  await expect(page.getByText(message)).toBeVisible();
  await page.getByText(message).locator('..').getByRole('link').click();
  await expect(
    page.getByRole('heading', { name: 'Instruction shown' }),
  ).toBeVisible();
  await expect(
    page.getByAltText("Learner's board when this report was opened"),
  ).toBeVisible();
  await page.getByLabel('Private note').fill('Check the target intersection.');
  await page.getByRole('button', { name: 'Save review', exact: true }).click();
  const progress = () =>
    page.evaluate(() =>
      Object.fromEntries(
        Object.keys(localStorage)
          .filter(
            (key) =>
              key.startsWith('tastir.along') ||
              key.startsWith('tastir.lessonAt') ||
              key === 'tastir.lastLesson',
          )
          .map((key) => [key, localStorage.getItem(key)]),
      ),
    );
  const before = await progress();
  await page
    .getByRole('button', { name: 'Open current lesson at this step' })
    .click();
  await expect(
    page.getByText("Owner review of today's lesson.", { exact: false }),
  ).toBeVisible();
  await expect(reportButton(page)).toBeVisible();
  await page.getByRole('button', { name: 'Back to this report' }).click();
  expect(await progress()).toEqual(before);
  await page
    .getByRole('button', { name: 'Prepare for AI', exact: true })
    .click();
  const preview = page.getByRole('region', { name: 'AI export preview' });
  await expect(
    preview.getByRole('heading', {
      name: 'Review what you will share with AI',
    }),
  ).toBeVisible();
  await preview
    .getByLabel('Message to share (editing this keeps the original report)')
    .fill('Redacted learner comment');
  const downloaded = page.waitForEvent('download');
  await preview
    .getByRole('button', { name: 'Download investigation bundle' })
    .click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  const parts: Buffer[] = [];
  for await (const chunk of stream!) parts.push(Buffer.from(chunk));
  const bundleText = Buffer.concat(parts).toString();
  expect(bundleText).toContain('Redacted learner comment');
  expect(bundleText).not.toContain('learner-private@');
  expect(bundleText).not.toContain('Check the target intersection.');
  const bundle = JSON.parse(bundleText);
  expect(bundle.reports).toHaveLength(1);
  expect(bundle.reports[0].snapshot.draft.steps).toEqual([]);
  await preview.getByRole('button', { name: 'Close export preview' }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `docs/review/feedback/${info.project.name}-inbox-dark.png`,
  });
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
  await page.screenshot({
    path: `docs/review/feedback/${info.project.name}-inbox-light.png`,
  });
});

test('blocked verification preserves the message, and closing restores focus', async ({
  page,
}) => {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.abort(),
  );
  await openReport(page);
  const input = page.getByLabel(
    'What happened, or what would you like to tell us?',
  );
  await input.fill('Please clarify this step.');
  await page.getByRole('button', { name: 'Close feedback' }).click();
  await expect(reportButton(page)).toBeFocused();
  await reportButton(page).click();
  await expect(input).toHaveValue('Please clarify this step.');
  await expect(
    page.getByRole('button', { name: 'Send feedback', exact: true }),
  ).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download unsent report' }).click();
  expect((await download).suggestedFilename()).toBe(
    'tastir-unsent-feedback.json',
  );
});

test('a lost response retries the same report without duplicating it', async ({
  page,
}) => {
  await fakeVerification(page);
  await openReport(page);
  const message = `Lost response ${Date.now()}`;
  await page
    .getByLabel('What happened, or what would you like to tell us?')
    .fill(message);
  let lost = false;
  await page.route('**/api/feedback', async (route) => {
    if (!lost) {
      lost = true;
      await route.fetch();
      await route.abort();
    } else await route.continue();
  });
  await page
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Retry same send' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Retry same send' }).click();
  await expect(
    page.getByText('Thanks — your feedback was sent.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close feedback' }).click();
  await signIn(page);
  const found = await page.request.get(
    `/api/owner/feedback?search=${encodeURIComponent(message)}`,
  );
  expect((await found.json()).reports).toHaveLength(1);
});

test('a cooldown preserves the draft and lets the learner retry after the wait', async ({
  page,
}) => {
  await fakeVerification(page);
  await openReport(page);
  const message = 'This instruction is unclear during a cooldown.';
  const input = page.getByLabel(
    'What happened, or what would you like to tell us?',
  );
  await input.fill(message);
  let first = true;
  await page.route('**/api/feedback', async (route) => {
    if (first) {
      first = false;
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '1' },
        body: JSON.stringify({
          code: 'cooldown',
          error: 'Please wait a moment. Your message is still here.',
        }),
      });
    } else await route.continue();
  });
  await page
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  await expect(input).toHaveValue(message);
  await expect(
    page.getByText('Please wait a moment. Your message is still here.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Send feedback', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  await expect(
    page.getByText('Thanks — your feedback was sent.'),
  ).toBeVisible();
});
