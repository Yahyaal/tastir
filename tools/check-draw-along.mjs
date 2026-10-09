import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
// Prefer the owner's standalone browser harness; fall back to this repo's install.
const standalone = resolve(
  homedir(),
  '.cache/tastir-tester/node_modules/playwright-core/index.mjs',
);
const { chromium } = await import(
  existsSync(standalone) ? pathToFileURL(standalone).href : '@playwright/test'
);
const cache = resolve(homedir(), '.cache/ms-playwright');
const version = existsSync(cache)
  ? readdirSync(cache)
      .filter((s) => /^chromium-\d+$/.test(s))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))[0]
  : undefined;
const executable = version && resolve(cache, version, 'chrome-linux64/chrome');
const sizes = JSON.parse(
  process.env.TASTIR_VIEWPORTS ??
    '[[1280,800],[1366,768],[1440,900],[1024,768],[390,844]]',
);
const tutorials = (
  process.env.TASTIR_TUTORIALS ??
  'eight-fold-star-and-cross,alhambra-comares-bones,twelve-fold-rosette-mian,alhambra-reyes-stars,bou-inania-rosette,kurt-eight-fold-zellige'
).split(',');
const output = process.env.TASTIR_LAYOUT_OUTPUT ?? 'docs/review/codex-layout';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch(
  executable && existsSync(executable) ? { executablePath: executable } : {},
);
const report = [];
const allErrors = [];
const settled = async (page) => {
  await page.waitForFunction(
    () =>
      !document
        .querySelector('.along-check[role="status"]')
        ?.textContent.includes('Checking'),
    null,
    { timeout: 60_000 },
  );
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
};
try {
  for (const [width, height] of sizes)
    for (const id of tutorials) {
      const phone = width < 761;
      const page = await browser.newPage({
        viewport: { width, height },
        isMobile: phone,
        hasTouch: phone || width === 1024,
        reducedMotion: 'reduce',
      });
      page.setDefaultTimeout(60_000);
      const result = {
        id,
        viewport: `${width}x${height}`,
        observations: [],
        errors: [],
      };
      page.on('pageerror', (e) => result.errors.push(e.message));
      const record = async (stage) => {
        const data = await page.evaluate(() => {
          const box = (el) => {
            const r = el.getBoundingClientRect();
            return {
              x: r.x + scrollX,
              y: r.y + scrollY,
              width: r.width,
              height: r.height,
            };
          };
          const boards = [...document.querySelectorAll('.along-plate')]
            .filter((el) => !el.hidden)
            .map(box);
          return {
            boards,
            pageWidth: document.documentElement.scrollWidth,
            pageHeight: document.documentElement.scrollHeight,
            footerBottom: Math.max(
              ...[...document.querySelectorAll('.caption:not([hidden])')].map(
                (el) => {
                  const r = el.getBoundingClientRect();
                  return r.bottom + scrollY;
                },
              ),
            ),
            status: [
              ...document.querySelectorAll('.along-check[role="status"]'),
            ].map((el) => ({
              text: el.textContent,
              height: el.clientHeight,
              contentHeight: el.scrollHeight,
            })),
          };
        });
        result.observations.push({ stage, ...data });
        const before = result.observations[0].boards[0];
        if (data.boards.length !== (phone ? 1 : 2))
          result.errors.push(`${stage}: missing visible board`);
        for (const [i, box] of data.boards.entries()) {
          if (box.x !== result.observations[0].boards[i]?.x)
            result.errors.push(`${stage}: board ${i} moved horizontally`);
          const keys = phone
            ? ['x', 'y', 'width', 'height']
            : ['y', 'width', 'height'];
          if (keys.some((k) => box[k] !== before[k]))
            result.errors.push(
              `${stage}: board moved ${JSON.stringify(before)} -> ${JSON.stringify(box)}`,
            );
        }
        if (data.pageWidth > width)
          result.errors.push(`${stage}: horizontal overflow ${data.pageWidth}`);
        if (
          !phone &&
          (data.pageHeight > height || data.footerBottom > height + 0.1)
        )
          result.errors.push(
            `${stage}: page/footers exceed viewport (${data.pageHeight}, ${data.footerBottom})`,
          );
        if (data.status.some((s) => s.contentHeight > s.height + 1))
          result.errors.push(`${stage}: clipped status`);
      };
      try {
        await page.goto(
          `${process.env.TASTIR_URL ?? 'http://localhost:4290'}/#/${id}/draw`,
        );
        await page.locator('.along-grid').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await settled(page);
        await record('start');
        const steps = page.locator('.along-steps button[aria-label^="Step "]');
        for (let i = 0; i < (await steps.count()); i++) {
          await steps.nth(i).click();
          await settled(page);
          await record(`step-${i + 1}`);
          const draw = page.getByRole('button', {
            name: 'Draw it for me',
            exact: true,
          });
          if (await draw.isEnabled()) {
            await draw.click();
            await settled(page);
            await record(`draw-${i + 1}`);
          }
        }
        await page.getByRole('button', { name: 'Ink', exact: true }).click();
        await record('ink-opening');
        await page
          .getByRole('button', { name: 'Ink it for me', exact: true })
          .click();
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll('button')].some(
              (b) => b.textContent === 'Repeat it' && !b.disabled,
            ),
          null,
          { timeout: 60_000 },
        );
        await settled(page);
        await record('ink-complete');
        if (phone) {
          await page.locator('.along-swap').click();
          await record('ink-reference');
          await page.locator('.along-swap').click();
        }
        await page
          .getByRole('button', { name: 'Repeat it', exact: true })
          .click();
        await settled(page);
        await record('repeat');
        await page
          .getByRole('button', { name: 'Fill the wall for me', exact: true })
          .click();
        await settled(page);
        await record('repeat-filled');
        await page
          .getByRole('button', { name: 'Color it', exact: true })
          .click();
        await record('color-opening');
        await page.waitForFunction(
          () =>
            !document
              .querySelector('.along-check[role="status"]')
              ?.textContent.includes('Finding'),
          null,
          { timeout: 60_000 },
        );
        await settled(page);
        await record('color-complete');
        if (phone) {
          await page.locator('.along-swap').click();
          await record('color-palette');
          await page.locator('.along-swap').click();
        }
        await page.screenshot({
          path: resolve(output, `${id}-${width}x${height}.png`),
          fullPage: true,
        });
      } catch (e) {
        result.errors.push(String(e));
      }
      report.push(result);
      allErrors.push(
        ...result.errors.map((e) => `${id} ${width}x${height}: ${e}`),
      );
      console.log(
        id,
        `${width}x${height}`,
        result.observations[0]?.boards[0],
        result.observations.length,
        'observations',
        result.errors.length,
        'errors',
      );
      if (result.errors.length) console.log(result.errors.slice(0, 2));
      writeFileSync(
        resolve(output, 'measurements.json'),
        JSON.stringify(report, null, 2),
      );
      await page.close();
    }
} finally {
  await browser.close();
}
console.log(
  `Measured ${report.length} tutorial/viewport pairs; ${allErrors.length} failures.`,
);
if (allErrors.length) process.exitCode = 1;
