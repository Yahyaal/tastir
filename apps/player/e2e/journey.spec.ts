import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tutorialFiles = readdirSync(resolve('tutorials')).filter((f) =>
  f.endsWith('.json'),
);
const star = 'eight-fold-star-and-cross';
const route = (id: string) => `/#/${id}`;
const payload = (data: unknown) =>
  'j' + Buffer.from(JSON.stringify(data)).toString('base64url');

test('library previews need no construction downloads except the animated hero', async ({
  page,
}) => {
  const tutorials: string[] = [];
  page.on('request', (r) => {
    if (/\/assets\/.*\.js/.test(r.url())) tutorials.push(r.url());
  });
  await page.goto('/');
  await expect(page.locator('.cards > li')).toHaveCount(tutorialFiles.length);
  const previews = page.locator('.cards img.thumbnail');
  await expect(previews).toHaveCount(tutorialFiles.length);
  await expect(previews.first()).toBeVisible();
  await expect
    .poll(() =>
      previews
        .first()
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  const sizes = await previews.evaluateAll((images) =>
    images.map((image) => {
      const { width, height } = image.getBoundingClientRect();
      return { width, height };
    }),
  );
  for (const { width, height } of sizes) {
    expect(width).toBeGreaterThan(0);
    expect(Math.abs(width - height)).toBeLessThan(1);
  }
  await expect(
    page.getByRole('link', { name: 'Start with the star and cross' }),
  ).toBeVisible();
  // A library card must be usable without downloading its JSON module.
  expect(
    tutorials.some((url) => url.includes('eight-fold-star-and-cross-')),
  ).toBe(false);
});

test('home navigation fits narrow phones before and after saving a design', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const fits = async () => {
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);
    const header = await page.locator('.masthead').boundingBox();
    expect(header).not.toBeNull();
    for (const link of await page
      .getByRole('navigation', { name: 'Main Navigation' })
      .locator('a, button')
      .all()) {
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(header!.x);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        header!.x + header!.width,
      );
    }
  };
  await page.goto('/');
  await expect(page.locator('.library')).toBeVisible();
  await fits();
  await page.goto(route(`${star}/result`));
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Phone wall');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Saved as “Phone wall”.', { exact: false }),
  ).toBeVisible();
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Your work (1)' }),
  ).toBeVisible();
  await fits();
});

test('unsaved changes confirmation keeps focus and Escape preserves the design', async ({
  page,
}) => {
  await page.goto(route(`${star}/result`));
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Unsaved wall');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Saved as “Unsaved wall”.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('group', { name: 'Palette' })
    .getByRole('button', { name: 'Marrakech', exact: true })
    .click();
  const address = page.url();
  const home = page.getByRole('link', { name: /All patterns/ });
  await home.focus();
  const overflow = await page.evaluate(() => document.body.style.overflow);
  await home.press('Enter');
  const dialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
  const stay = dialog.getByRole('button', { name: 'Stay', exact: true });
  const leave = dialog.getByRole('button', { name: 'Leave without saving' });
  await expect(stay).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(leave).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(stay).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.label')).toHaveText('Color');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(home).toBeFocused();
  await expect(page).toHaveURL(address);
  await expect(
    page
      .getByRole('group', { name: 'Palette' })
      .getByRole('button', { name: 'Marrakech', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    overflow,
  );
  await home.press('Enter');
  await dialog.getByRole('button', { name: 'Leave without saving' }).click();
  await expect(page.locator('.library')).toBeVisible();
});

test('Upcoming card headers keep complete Arabic titles within their cards', async ({
  page,
}) => {
  await page.goto('/#/upcoming');
  const titles = page.locator('.card-arabic-title');
  await expect(titles).toHaveCount(24);
  await page.evaluate(() => document.fonts.ready);
  const fits = async () => {
    const boxes = await titles.evaluateAll((elements) =>
      elements.map((title) => {
        const text = title.getBoundingClientRect();
        const header = title.closest('.card-top-meta')!.getBoundingClientRect();
        return {
          left: text.left,
          right: text.right,
          headerLeft: header.left,
          headerRight: header.right,
          scroll: title.scrollWidth,
          width: title.clientWidth,
        };
      }),
    );
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(box.headerLeft - 1);
      expect(box.right).toBeLessThanOrEqual(box.headerRight + 1);
      expect(box.scroll).toBeLessThanOrEqual(box.width + 1);
    }
  };
  await fits();
  await page.setViewportSize({ width: 320, height: 740 });
  await fits();
});

test('Upcoming inspection keeps keyboard focus inside and returns to its card', async ({
  page,
}) => {
  await page.goto('/#/upcoming');
  const card = page.locator('.upcoming-card').first();
  await card.getByRole('button', { name: /Blueprint/ }).click();
  const opener = card.locator('.card-blueprint-interactive');
  await opener.focus();
  const overflow = await page.evaluate(() => document.body.style.overflow);
  await opener.press('Enter');
  const viewer = page.getByRole('dialog');
  await expect(
    viewer.getByRole('button', { name: 'Close inspection view', exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    'hidden',
  );
  const controls = await viewer
    .locator('button:not(:disabled), a[href]')
    .count();
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i <= controls; i++) {
      await page.keyboard.press(key);
      expect(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest('[role="dialog"]')),
        ),
      ).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    overflow,
  );
});

test('player shortcuts respect controls and still work on the page', async ({
  page,
}) => {
  await page.goto(route(`${star}/watch`));
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.label')).toHaveText('Step 1 of 6');
  await page.getByRole('button', { name: 'Next', exact: true }).press('Space');
  await expect(page.locator('.label')).toHaveText('Step 2 of 6');
  await page.getByRole('button', { name: 'Go to color', exact: true }).click();
  await expect(page.locator('.label')).toHaveText('Color');
  await page.getByRole('combobox', { name: 'Style', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.label')).toHaveText('Color');
  await page.getByRole('button', { name: 'Back', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.label')).toHaveText('Color');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.label')).toHaveText('Repeat');
});

test('the original photo viewer contains keyboard focus and restores it on Escape', async ({
  page,
}) => {
  await page.goto(route('minbar-doors-cairo/result'));
  const opener = page.getByRole('button', {
    name: /See the photo at full size/,
  });
  const beforeOverflow = await page.evaluate(
    () => document.body.style.overflow,
  );
  await opener.click();
  const dialog = page.getByRole('dialog');
  const close = dialog.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    'hidden',
  );
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Actual size', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    beforeOverflow,
  );
});

test('blocked storage warns without covering controls or moving the boards', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem;
    Object.assign(window, {
      restoreTestStorage: () => {
        Storage.prototype.setItem = write;
      },
    });
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage full', 'QuotaExceededError');
    };
  });
  await page.goto(route('alhambra-comares-bones/draw'));
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('cannot save your board');
  await page.evaluate(() => document.fonts.ready);
  const visibleBounds = async () =>
    (await boardBounds(page)).filter((box) => box.width > 0 && box.height > 0);
  const before = await visibleBounds();
  const warning = await alert.boundingBox();
  const instructions = await page.locator('.along-text-row').boundingBox();
  expect(warning!.y).toBeGreaterThanOrEqual(instructions!.y);
  expect(warning!.y + warning!.height).toBeLessThanOrEqual(
    instructions!.y + instructions!.height,
  );
  await page
    .getByRole('button', { name: 'Draw it for me', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Step 1, on your board', exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as Window & { restoreTestStorage: () => void }
    ).restoreTestStorage(),
  );
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(alert).toHaveCount(0);
  expect(await visibleBounds()).toEqual(before);
});

test('a missing original photo keeps its source link and shows no broken image', async ({
  page,
}) => {
  await page.route('**/photos/cairo-minbar-doors-met.jpg', (request) =>
    request.fulfill({ status: 404, body: 'Not found' }),
  );
  await page.goto(route('minbar-doors-cairo/result'));
  const original = page.getByRole('figure', { name: 'The original' });
  await expect(
    original.getByText('This photo could not be loaded.'),
  ).toBeVisible();
  await expect(original.getByRole('img')).toHaveCount(0);
  await expect(original.getByRole('button', { name: /full size/ })).toHaveCount(
    0,
  );
  await expect(
    original.getByRole('link', { name: 'its source' }),
  ).toHaveAttribute(
    'href',
    'https://www.metmuseum.org/art/collection/search/444812',
  );
});

test('a beginner draws the first circle, gets a completed step, and resumes', async ({
  page,
  hasTouch,
}, info) => {
  await page.goto(route(`${star}/draw`));
  await expect(
    page.getByText(/Choose Compass, (click|tap) O, then E\./),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Compass', exact: true }),
  ).toHaveClass(/hinted/);
  await page.getByRole('button', { name: 'Compass', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  const svg = page.locator('.along-plate .editor-drawing');
  await svg.scrollIntoViewIfNeeded();
  for (const x of [0, 1]) {
    const p = await svg.evaluate((el: SVGSVGElement, x) => {
      const p = new DOMPoint(x, 0).matrixTransform(el.getScreenCTM()!);
      return { x: p.x, y: p.y };
    }, x);
    if (hasTouch) await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
  }
  await expect(
    page.getByRole('button', { name: 'Step 1, on your board', exact: true }),
  ).toBeVisible();
  const visibleBounds = async () =>
    (await boardBounds(page)).filter((box) => box.width > 0 && box.height > 0);
  const savedBounds = await visibleBounds();
  await page.reload();
  await expect(page.getByText(/Welcome back/)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await visibleBounds()).toEqual(savedBounds);
  const resume = page.getByRole('button', {
    name: 'Continue drawing',
    exact: true,
  });
  // On a phone the step's buttons are in the fixed bar at the bottom;
  // elsewhere they sit in the step's own row.
  if (info.project.name === 'phone') await expect(resume).toBeInViewport();
  else {
    const resumeBox = await resume.boundingBox();
    const instructionBox = await page.locator('.along-text-row').boundingBox();
    expect(resumeBox!.y).toBeGreaterThanOrEqual(instructionBox!.y);
    expect(resumeBox!.y + resumeBox!.height).toBeLessThanOrEqual(
      instructionBox!.y + instructionBox!.height,
    );
  }
  await page
    .getByRole('button', { name: 'Continue drawing', exact: true })
    .click();
  await expect(page.getByText(/Welcome back/)).toHaveCount(0);
  expect(await visibleBounds()).toEqual(savedBounds);
  await expect(
    page.getByRole('button', { name: 'Step 1, on your board', exact: true }),
  ).toBeVisible();
});

test('a finished wall can be saved, shared, reopened, and used for a variation', async ({
  page,
  context,
}) => {
  await page.goto(route(`${star}/result`));
  await page
    .getByRole('group', { name: 'Palette' })
    .getByRole('button', { name: 'Chefchaouen', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Save as my design', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Browser test wall');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Saved as “Browser test wall”.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Copy a share link' }).click();
  const link = await page
    .getByRole('textbox', { name: 'Share link' })
    .inputValue();
  const other = await context.newPage();
  await other.goto(link);
  await expect(other.getByText(/A pattern shared with you/)).toBeVisible();
  await expect(
    other
      .getByRole('group', { name: 'Palette' })
      .getByRole('button', { name: 'Chefchaouen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await other.close();
  await page.reload();
  await expect(
    page
      .getByRole('group', { name: 'Palette' })
      .getByRole('button', { name: 'Chefchaouen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Make a variation', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/edit\//);
  await expect(page.locator('.editor-step')).toHaveCount(6);
  await expect(page.locator('.editor-step.broken')).toHaveCount(0);
});

test('bad links recover and never leave a blank page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    route(
      'shared/' +
        payload({
          library: star,
          design: { coloring: { palette: 'Fès tile' } },
        }),
    ),
  );
  await expect(
    page.getByRole('heading', { name: 'This pattern cannot be shown' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /All patterns/ }).click();
  await expect(page.locator('.cards > li')).toHaveCount(tutorialFiles.length);
  await page.goto('/#/%E0%A4%A');
  await expect(
    page.getByRole('heading', { name: 'This pattern cannot be shown' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

async function boardBounds(page: Page) {
  return page.locator('.along-plate').evaluateAll((elements) =>
    elements.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.x + window.scrollX,
        y: r.y + window.scrollY,
        width: r.width,
        height: r.height,
        bottom: r.bottom + window.scrollY,
      };
    }),
  );
}
const tutorials = resolve('tutorials');
const beginners = tutorialFiles
  .map((f) => JSON.parse(readFileSync(resolve(tutorials, f), 'utf8')))
  .filter((t) => t.level === 'beginner');
for (const tutorial of beginners) {
  test(`${tutorial.id}: the board holds still and fits, with the guide on it, through construction and ink`, async ({
    page,
  }, info) => {
    await page.goto(route(`${tutorial.id}/draw`));
    await expect(page.locator('.along-grid')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // One board: the learner's drawing, with the step to copy laid over it.
    const before = await boardBounds(page);
    expect(before).toHaveLength(1);
    if (info.project.name !== 'phone')
      expect(before[0]!.bottom).toBeLessThanOrEqual(
        page.viewportSize()!.height,
      );
    const guideOnBoard = () =>
      page.locator('.along-plate').evaluate((plate) => {
        const board = plate.querySelector('.editor-drawing');
        const guide = plate.querySelector('.along-guide svg');
        if (!board || !guide) return Infinity;
        const a = board.getBoundingClientRect();
        const b = guide.getBoundingClientRect();
        return Math.max(
          Math.abs(a.x - b.x),
          Math.abs(a.y - b.y),
          Math.abs(a.width - b.width),
          Math.abs(a.height - b.height),
        );
      });
    expect(await guideOnBoard()).toBeLessThanOrEqual(1);
    const steps = page.locator('.along-steps button[aria-label^="Step "]');
    for (let i = 0; i < (await steps.count()); i++) {
      await steps.nth(i).click();
      expect(await boardBounds(page)).toEqual(before);
      expect(await guideOnBoard()).toBeLessThanOrEqual(1);
    }
    await page.getByRole('button', { name: 'Ink', exact: true }).click();
    expect(await boardBounds(page)).toEqual(before);
    expect(await guideOnBoard()).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
