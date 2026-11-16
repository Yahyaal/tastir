/** Reproduce the ink audit without checking out historical files or changing tutorials.
 * node --conditions=@tastir/source --import tsx tools/audit-ink-merges.mts
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { cellOf, evaluate, inkStrokes } from '../packages/engine/src/index.js';
import { parseTutorial } from '../packages/schema/src/index.js';
import {
  compareInk,
  type InkComparison,
  type Stroke,
} from '../apps/player/src/review/inkComparison.js';

const out = 'docs/review/ink-overlay/merges';
const source = execFileSync('git', ['rev-parse', 'ac3b7bd^'], {
  encoding: 'utf8',
}).trim();
const current = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const comparisonSha256 = createHash('sha256')
  .update(readFileSync('apps/player/src/review/inkComparison.ts'))
  .digest('hex');
mkdirSync(out, { recursive: true });
const wall = (raw: unknown) => {
  const t = parseTutorial(raw),
    s = evaluate(t);
  return {
    ...cellOf(s, t.pattern.cell),
    ink: inkStrokes(s, t).map((q) => q.segment),
  };
};
function svg(result: InkComparison): string {
  const points = result.boundary;
  if (!points.length) return '';
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const x = Math.min(...xs),
    y = Math.min(...ys),
    w = Math.max(...xs) - x,
    h = Math.max(...ys) - y;
  const margin = Math.max(w, h) * 0.06;
  const lines = (ss: Stroke[], color: string) =>
    ss
      .map(
        (s) =>
          `<line x1="${s.a.x}" y1="${-s.a.y}" x2="${s.b.x}" y2="${-s.b.y}" stroke="${color}"/>`,
      )
      .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="${x - margin} ${-y - h - margin} ${w + 2 * margin} ${h + 2 * margin}"><rect x="${x - margin}" y="${-y - h - margin}" width="${w + 2 * margin}" height="${h + 2 * margin}" fill="#faf7f1"/><g stroke-width="${Math.max(w, h) / 450}" fill="none">${lines(result.shared, '#62666b')}${lines(result.onlyA, '#245da1')}${lines(result.onlyB, '#bc4b22')}</g></svg>`;
}
const rows = [];
for (const file of readdirSync('tutorials')
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const base = JSON.parse(readFileSync(`tutorials/${file}`, 'utf8'));
  for (const place of base.places ?? []) {
    const raw = JSON.parse(
      execFileSync('git', ['show', `${source}:tutorials/${place.id}.json`], {
        encoding: 'utf8',
      }),
    );
    const started = performance.now();
    const result = compareInk(wall(raw), wall(base));
    const name = `${place.id}--${base.id}`;
    writeFileSync(`${out}/${name}.json`, JSON.stringify(result));
    const picture = svg(result);
    if (picture) {
      writeFileSync(`${out}/${name}.svg`, picture);
      await sharp(Buffer.from(picture)).png().toFile(`${out}/${name}.png`);
    }
    const row = {
      place: place.id,
      title: raw.title,
      base: base.id,
      baseTitle: base.title,
      status: result.status,
      reason: result.reason,
      coverageA: result.coverageA,
      coverageB: result.coverageB,
      mirrored: result.placement?.mirrored,
      cellsA: result.repeatA?.cells,
      cellsB: result.repeatB?.cells,
      picture: picture ? `${name}.png` : undefined,
      ms: Math.round(performance.now() - started),
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
}
writeFileSync(
  `${out}/summary.json`,
  JSON.stringify({ source, current, comparisonSha256, rows }, null, 2) + '\n',
);
