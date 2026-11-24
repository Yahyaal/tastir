/** @jsxRuntime automatic */
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseTutorial } from '@tastir/schema';
import { Thumbnail } from '../app/drawing';
import { loadModel, type Model } from '../app/model';
import {
  paletteOf,
  SLOTS,
  slotOf,
  touchingTypes,
  typeKey,
  type Coloring,
} from '../app/coloring';
import {
  byPlace,
  colorRepeat,
  colouredModel,
  placeKey,
  ruleFills,
} from '../app/placement';

/*
 * Contact sheets for reviewing the palette engine (dev only, not shipped):
 * node --conditions=@tastir/source --import tsx \
 *   apps/player/src/build/paletteSheets.tsx <out dir> [id,id,...]
 * Each sheet is one wall under six palettes, the rules alone (A) beside
 * the engine (B), as tiles and, for a banded wall, under its bands.
 */

const PALETTES = [
  'Marinid zellige',
  'Alhambra',
  'Timurid tile',
  'Mamluk wood',
  'Modern Moroccan',
  'Fès tile',
];
const SIDE = 260;

/** The rules' colours as colours the learner chose, so the engine keeps
 * them: the old picture through the same renderer. */
function frozen(model: Model, coloring: Coloring, look: string): Coloring {
  const coloured = colouredModel(model, coloring);
  const chosen: Record<string, string> = {};
  if (byPlace(coloured)) {
    const fill = ruleFills(coloured, coloring);
    const [m, n] = colorRepeat(coloured);
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        coloured.pattern.pieces.forEach((_, k) => {
          chosen[placeKey(coloured, k, i, j)] = fill(k, i, j);
        });
  } else {
    const palette = paletteOf(model, coloring.palette);
    const touching = touchingTypes(model);
    const near = (a: number, b: number) =>
      touching.has(a < b ? `${a},${b}` : `${b},${a}`);
    const out: string[] = [];
    model.pattern.types.forEach((t, i) => {
      const want = palette[slotOf(model, t, i)];
      const taken = out.flatMap((c, k) => (near(i, k) ? [c] : []));
      const free = (c: string) => !taken.includes(c);
      const c = free(want)
        ? want
        : (SLOTS.map((s) => palette[s]).find(free) ?? want);
      out.push(c);
      chosen[typeKey(t)] = c;
    });
  }
  return { ...coloring, chosen };
}

async function render(model: Model, coloring: Coloring, look: string) {
  const svg = renderToStaticMarkup(
    <Thumbnail model={model} coloring={coloring} look={look as never} />,
  ).replace(
    '<svg ',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIDE}" height="${SIDE}" `,
  );
  return sharp(Buffer.from(svg)).resize(SIDE, SIDE).png().toBuffer();
}

const label = (text: string, w: number) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="26"><rect width="100%" height="100%" fill="#111"/><text x="6" y="18" font-family="sans-serif" font-size="15" fill="#fff">${text}</text></svg>`,
  );

async function main() {
  const [outDir, ids] = process.argv.slice(2);
  if (!outDir || !ids) throw new Error('Give an out dir and ids.');
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  mkdirSync(outDir, { recursive: true });
  for (const id of ids.split(',')) {
    const model = loadModel(
      parseTutorial(
        JSON.parse(
          readFileSync(resolve(root, 'tutorials', `${id}.json`), 'utf8'),
        ),
      ),
    );
    const own = model.tutorial.pattern.look;
    const looks =
      own === 'strapwork' || own === 'interlace' ? ['tiles', own] : ['tiles'];
    for (const look of looks) {
      const cells: { input: Buffer; left: number; top: number }[] = [];
      const cols = 3;
      const cw = SIDE * 2 + 12;
      const ch = SIDE + 26 + 12;
      for (const [k, palette] of PALETTES.entries()) {
        const coloring: Coloring = { palette, chosen: {} };
        const x = (k % cols) * cw;
        const y = Math.floor(k / cols) * ch;
        cells.push({
          input: label(`${palette}: A rules | B engine`, cw - 12),
          left: x,
          top: y,
        });
        cells.push({
          input: await render(model, frozen(model, coloring, look), look),
          left: x,
          top: y + 26,
        });
        cells.push({
          input: await render(model, coloring, look),
          left: x + SIDE + 4,
          top: y + 26,
        });
      }
      const file = resolve(outDir, `${id}--${look}.png`);
      await sharp({
        create: {
          width: cols * cw,
          height: 2 * ch,
          channels: 3,
          background: '#2a2a2a',
        },
      })
        .composite(cells)
        .png()
        .toFile(file);
      console.log(file);
    }
  }
}

void main();
