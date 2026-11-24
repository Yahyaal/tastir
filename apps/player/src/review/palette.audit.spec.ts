import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'vitest';
import { loadModel, type Model } from '../app/model';
import {
  finishOf,
  isPaper,
  paletteOf,
  PALETTES,
  pieceColors,
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
  placeFills,
  ruleFills,
} from '../app/placement';
import { deltaE, disharmony, lch, merges } from '@tastir/project-core/harmony';

/**
 * The palette engine's audit, run by hand (PALETTE_OUT=path): every
 * tutorial under every tile palette, as tiles and under white bands, in
 * its own way of colouring (by shape, ring or place), measured piece by
 * piece over the repeat and its neighbours, with the rules alone (A) and
 * with the engine (B).
 */
const out = process.env['PALETTE_OUT'];
const only = process.env['PALETTE_ONLY'];
const dir = resolve(__dirname, '../../../../tutorials');

/** By shape before the engine: each shape its slot, a touching repeat moved
 * to the first free slot. */
function shapeBefore(model: Model, coloring: Coloring): string[] {
  const palette = paletteOf(model, coloring.palette);
  const { types } = model.pattern;
  const touching = touchingTypes(model);
  const near = (a: number, b: number) =>
    touching.has(a < b ? `${a},${b}` : `${b},${a}`);
  const res: string[] = [];
  types.forEach((t, i) => {
    const want = coloring.chosen[typeKey(t)] ?? palette[slotOf(model, t, i)];
    const taken = res.flatMap((c, k) => (near(i, k) ? [c] : []));
    const free = (c: string) =>
      !taken.some((x) => x.toLowerCase() === c.toLowerCase());
    res.push(
      free(want) ? want : (SLOTS.map((s) => palette[s]).find(free) ?? want),
    );
  });
  return res;
}

interface Score {
  same: number;
  near: number;
  flatValue: number;
  hidden: number;
  flood: number;
  accent: number;
  disharmony: number;
}

function measure(
  model: Model,
  colour: (piece: number, i: number, j: number) => string,
  band?: string,
): Score {
  const { pieces, cell } = model.pattern;
  const [m, n] = colorRepeat(model);
  const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
  const sides = new Map<string, [string, number][]>();
  const used = new Map<string, number>();
  for (let i = -1; i <= m; i++)
    for (let j = -1; j <= n; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      pieces.forEach((p, k) => {
        const c = colour(k, i, j).toLowerCase();
        if (i >= 0 && j >= 0 && i < m && j < n) {
          const a2 = Math.abs(
            p.polygon.reduce((s, q, t) => {
              const r = p.polygon[(t + 1) % p.polygon.length]!;
              return s + q.x * r.y - r.x * q.y;
            }, 0),
          );
          used.set(c, (used.get(c) ?? 0) + a2);
        }
        const ps = p.polygon.map((q) => key(q.x + dx, q.y + dy));
        ps.forEach((a, s) => {
          const b = ps[(s + 1) % ps.length] ?? a;
          const side = a < b ? `${a}|${b}` : `${b}|${a}`;
          const list = sides.get(side) ?? [];
          list.push([c, p.type]);
          sides.set(side, list);
        });
      });
    }
  let shared = 0;
  let same = 0;
  let near = 0;
  let flat = 0;
  for (const list of sides.values()) {
    if (list.length !== 2) continue;
    const [[a, ta], [b, tb]] = list as [[string, number], [string, number]];
    // A ring's or a shape's own pieces touching is the colouring's design;
    // the rule is about different shapes running together.
    if (ta === tb) continue;
    shared++;
    if (a === b) same++;
    else if (merges(a, b)) near++;
    else if (Math.abs(lch(a).L - lch(b).L) < 0.05) flat++;
  }
  const total = [...used.values()].reduce((x, y) => x + y, 0) || 1;
  const shares = new Map([...used].map(([c, a]) => [c, a / total]));
  const strongest = [...shares.keys()].sort((x, y) => lch(y).C - lch(x).C)[0];
  return {
    same: shared ? same / shared : 0,
    near: shared ? near / shared : 0,
    flatValue: shared ? flat / shared : 0,
    hidden: band
      ? [...shares]
          .filter(([c]) => deltaE(c, band) < 0.15)
          .reduce((x, [, s]) => x + s, 0)
      : 0,
    flood: Math.max(...shares.values()),
    accent: strongest ? (shares.get(strongest) ?? 0) : 0,
    disharmony: disharmony(shares),
  };
}

it.skipIf(!out)(
  'audits the palette engine against the rules alone',
  () => {
    const palettes = Object.keys(PALETTES).filter((p) => !isPaper(p));
    const rows: Record<string, unknown>[] = [];
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .filter((f) => !only || only.split(',').includes(f.replace('.json', '')))
      .sort();
    for (const f of files) {
      let model: Model;
      try {
        model = loadModel(JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
      } catch {
        continue;
      }
      if (!model.pattern.types.length) continue;
      for (const palette of palettes) {
        const coloring: Coloring = { palette, chosen: {} };
        const coloured = colouredModel(model, coloring);
        const placed = byPlace(coloured);
        const finish = finishOf(coloured, coloring);
        for (const look of ['tiles', 'interlace'] as const) {
          const surround =
            look === 'interlace'
              ? { band: finish.band, edge: finish.lines }
              : {};
          let a: (k: number, i: number, j: number) => string;
          let b: (k: number, i: number, j: number) => string;
          if (placed) {
            a = ruleFills(coloured, coloring);
            b = placeFills(coloured, coloring, surround);
          } else {
            const old = shapeBefore(coloured, coloring);
            const now = pieceColors(coloured, coloring, surround);
            const type = (k: number) => coloured.pattern.pieces[k]!.type;
            a = (k) => old[type(k)] ?? '#999999';
            b = (k) => now[type(k)] ?? '#999999';
          }
          rows.push({
            id: f.replace('.json', ''),
            palette,
            look,
            method: placed
              ? coloured.tutorial.pattern.rings
                ? 'rings'
                : 'place'
              : 'shape',
            before: measure(coloured, a, surround.band),
            after: measure(coloured, b, surround.band),
          });
        }
      }
    }
    const avg = (look: string, side: 'before' | 'after', k: keyof Score) => {
      const r = rows.filter((x) => x['look'] === look);
      return r.reduce((s, x) => s + (x[side] as Score)[k], 0) / (r.length || 1);
    };
    const count = (
      look: string,
      side: 'before' | 'after',
      test: (s: Score) => boolean,
    ) =>
      rows.filter((x) => x['look'] === look && test(x[side] as Score)).length;
    const summary = Object.fromEntries(
      ['tiles', 'interlace'].map((look) => [
        look,
        {
          walls: rows.filter((x) => x['look'] === look).length,
          wallsWithSameColourNeighbours: [
            count(look, 'before', (s) => s.same > 0),
            count(look, 'after', (s) => s.same > 0),
          ],
          wallsWithNearColourNeighbours: [
            count(look, 'before', (s) => s.near > 0),
            count(look, 'after', (s) => s.near > 0),
          ],
          wallsHidingBands: [
            count(look, 'before', (s) => s.hidden > 0),
            count(look, 'after', (s) => s.hidden > 0),
          ],
          sameSideShare: [
            avg(look, 'before', 'same'),
            avg(look, 'after', 'same'),
          ],
          flatValueShare: [
            avg(look, 'before', 'flatValue'),
            avg(look, 'after', 'flatValue'),
          ],
          disharmony: [
            avg(look, 'before', 'disharmony'),
            avg(look, 'after', 'disharmony'),
          ],
          accentOver35: [
            count(look, 'before', (s) => s.accent > 0.35),
            count(look, 'after', (s) => s.accent > 0.35),
          ],
          floodOver60: [
            count(look, 'before', (s) => s.flood > 0.6),
            count(look, 'after', (s) => s.flood > 0.6),
          ],
        },
      ]),
    );
    writeFileSync(out as string, JSON.stringify({ summary, rows }, null, 1));
  },
  3_600_000,
);
