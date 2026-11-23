import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'vitest';
import { loadModel } from '../app/model';
import {
  colourDistance,
  extraColors,
  finishOf,
  isPaper,
  paletteOf,
  PALETTES,
  pieceColors,
  SLOTS,
  slotOf,
  touchingTypes,
  typeKey,
  underBand,
  type Coloring,
} from '../app/coloring';
import type { Model } from '../app/model';

/**
 * The palette engine's audit, run by hand (PALETTE_OUT=path): every
 * tutorial under every tile palette, as tiles and under bands, coloured by
 * shape with the old rule (each shape its slot, a touching repeat moved to
 * the first free slot, then re-tinted under bands) and with the engine.
 * Writes the rows and a summary to PALETTE_OUT.
 */
const out = process.env['PALETTE_OUT'];
const dir = resolve(__dirname, '../../../../tutorials');
const NEAR = 48;

/** The rule before the engine (STYLE.2), for comparison. */
function before(model: Model, coloring: Coloring): string[] {
  const palette = paletteOf(model, coloring.palette);
  const { types } = model.pattern;
  const wanted = types.map(
    (t, i) => coloring.chosen[typeKey(t)] ?? palette[slotOf(model, t, i)],
  );
  const touching = touchingTypes(model);
  const near = (a: number, b: number) =>
    touching.has(a < b ? `${a},${b}` : `${b},${a}`);
  const res: string[] = [];
  types.forEach((_, i) => {
    const want = wanted[i] ?? palette.a;
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
  touchSame: number;
  touchNear: number;
  hidden: number;
  greyed: number;
  flood: number;
  colours: number;
}

function score(
  model: Model,
  colours: string[],
  band?: string,
  edge?: string,
): Score {
  const shown = band
    ? colours.map((c) => underBand(c, band, colours, edge))
    : colours;
  const { types } = model.pattern;
  const areas = types.map((t) => Math.abs(t.area) * Math.max(1, t.perCell));
  const total = areas.reduce((x, y) => x + y, 0) || 1;
  let touchSame = 0;
  let touchNear = 0;
  for (const k of touchingTypes(model)) {
    const [a, b] = k.split(',').map(Number) as [number, number];
    const x = shown[a] ?? '';
    const y = shown[b] ?? '';
    if (x.toLowerCase() === y.toLowerCase()) touchSame++;
    else if (colourDistance(x, y) < NEAR) touchNear++;
  }
  const used = new Map<string, number>();
  shown.forEach((c, i) =>
    used.set(
      c.toLowerCase(),
      (used.get(c.toLowerCase()) ?? 0) + (areas[i] ?? 0) / total,
    ),
  );
  return {
    touchSame,
    touchNear,
    hidden: band
      ? colours.filter((c) => colourDistance(c, band) < NEAR).length
      : 0,
    // Pieces re-tinted under the bands, the grey of the owner's note.
    greyed: shown.filter((c, i) => c !== colours[i]).length,
    flood: Math.max(...used.values()),
    colours: used.size,
  };
}

it.skipIf(!out)(
  'audits the palette engine against the old rule',
  () => {
    const palettes = Object.keys(PALETTES).filter((p) => !isPaper(p));
    const rows: Record<string, unknown>[] = [];
    for (const f of readdirSync(dir)
      .filter((n) => n.endsWith('.json'))
      .sort()) {
      let model: Model;
      try {
        model = loadModel(JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
      } catch {
        continue;
      }
      if (!model.pattern.types.length) continue;
      for (const palette of palettes) {
        const coloring: Coloring = { palette, chosen: {} };
        const finish = finishOf(model, coloring);
        for (const look of ['tiles', 'interlace'] as const) {
          const band = look === 'interlace' ? finish.band : undefined;
          const edge = look === 'interlace' ? finish.lines : undefined;
          const old = before(model, coloring);
          const palette0 = paletteOf(model, palette);
          const wish = model.pattern.types.map(
            (t, i) => palette0[slotOf(model, t, i)],
          );
          const now = pieceColors(model, coloring, band ? { band, edge } : {});
          rows.push({
            id: f.replace('.json', ''),
            palette,
            look,
            types: model.pattern.types.length,
            before: score(model, old, band, edge),
            after: score(model, now, band, edge),
            wish: score(model, wish, band, edge),
            fromWish: now.filter(
              (c, i) => c.toLowerCase() !== (wish[i] ?? '').toLowerCase(),
            ).length,
            changed: now.filter(
              (c, i) => c.toLowerCase() !== (old[i] ?? '').toLowerCase(),
            ).length,
            extras: now.filter((c) =>
              Object.values(extraColors(model, palette)).includes(c),
            ).length,
          });
        }
      }
    }
    const sum = (look: string, side: 'before' | 'after', k: keyof Score) =>
      rows
        .filter((r) => r['look'] === look)
        .reduce(
          (x, r) =>
            x + ((r[side] as Score)[k] > (k === 'flood' ? 0.5 : 0) ? 1 : 0),
          0,
        );
    const summary = Object.fromEntries(
      ['tiles', 'interlace'].map((look) => [
        look,
        Object.fromEntries(
          (
            ['touchSame', 'touchNear', 'hidden', 'greyed', 'flood'] as const
          ).map((k) => [
            k,
            { before: sum(look, 'before', k), after: sum(look, 'after', k) },
          ]),
        ),
      ]),
    );
    writeFileSync(
      out as string,
      JSON.stringify({ walls: rows.length / 2, summary, rows }, null, 1),
    );
  },
  1_800_000,
);
