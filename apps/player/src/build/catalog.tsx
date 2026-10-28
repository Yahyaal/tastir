/** @jsxRuntime automatic */
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import {
  existsSync,
  unlinkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { Thumbnail } from '../app/drawing';
import { loadModel, shownSteps, withHelpers } from '../app/model';
import type { Tutorial } from '@tastir/schema';

async function main() {
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  const out = resolve(root, 'apps/player/src/generated/catalog.ts');
  const thumbnails = resolve(root, 'apps/player/public/thumbnails');
  mkdirSync(dirname(out), { recursive: true });
  mkdirSync(thumbnails, { recursive: true });
  const catalog = [];
  for (const file of readdirSync(resolve(root, 'tutorials'))
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    const json = JSON.parse(
      readFileSync(resolve(root, 'tutorials', file), 'utf8'),
    );
    const model = loadModel(json);
    const t = model.tutorial;
    const id = file.replace(/\.json$/, '');
    const svg = renderToStaticMarkup(<Thumbnail model={model} />)
      .replace(
        '<svg ',
        '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" ',
      )
      .replace(
        '><path',
        '><style>.piece{stroke:#f8fafc;stroke-width:1.5px;stroke-linejoin:round}.piece.strap{stroke-width:1px}</style><path',
      );
    const hash = createHash('sha256').update(svg).digest('hex').slice(0, 12);
    const filename = `${id}-${hash}.webp`;
    if (!existsSync(resolve(thumbnails, filename))) {
      await sharp(Buffer.from(svg))
        .resize(480, 480)
        .webp({ quality: 90 })
        .toFile(resolve(thumbnails, filename));
    }
    catalog.push({
      id,
      title: t.title,
      ...(t.short ? { short: t.short } : {}),
      ...(t.subtitle ? { subtitle: t.subtitle } : {}),
      style: t.style,
      ...(t.region ? { region: t.region } : {}),
      level: t.level,
      words: searchWords(t),
      // As the library shows it: the main star's points, else the tile's.
      fold: t.star ?? t.fold,
      steps: shownSteps(withHelpers(model, false).tutorial).length,
      photos: Boolean(t.photos?.length),
      ...(t.verification ? { verification: t.verification } : {}),
      thumbnail: `thumbnails/${filename}`,
    });
  }
  const used = new Set(
    catalog.map((entry) => entry.thumbnail.replace('thumbnails/', '')),
  );
  for (const name of readdirSync(thumbnails)) {
    if (/\.(svg|webp)$/.test(name) && !used.has(name))
      unlinkSync(resolve(thumbnails, name));
  }
  writeFileSync(
    out,
    'export default ' + JSON.stringify(catalog) + ' as const;\n',
  );
  console.log(`Prepared ${catalog.length} library previews.`);
}
/** What a search may find a tutorial by beyond its names: its sources and
 * who made them, and its piece names. */
function searchWords(t: Tutorial): string {
  const words = [
    ...t.credits.flatMap((c) => [c.source, c.creator ?? '']),
    ...t.expect.pieces.map((p) => p.name.replace(/_/g, ' ')),
  ];
  return [...new Set(words.join(' ').split(/\s+/).filter(Boolean))].join(' ');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
