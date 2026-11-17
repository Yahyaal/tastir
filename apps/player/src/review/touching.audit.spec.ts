import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'vitest';
import { loadModel } from '../app/model';
import { lightness, pieceColors, tutorialColoring } from '../app/coloring';
import { byPlace, colouredModel, placeFills } from '../app/placement';

/**
 * STYLE.2 audit, run by hand: in each tutorial's own colouring, how many
 * shared sides have the same colour on both sides. Writes a JSON summary
 * to the path in TOUCHING_OUT. Skipped unless TOUCHING_OUT is set.
 */
const out = process.env['TOUCHING_OUT'];
const dir = resolve(__dirname, '../../../../tutorials');

it.skipIf(!out)('audits touching same-colour pieces', () => {
  const rows: Record<string, unknown>[] = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    let model;
    try {
      model = loadModel(JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
    } catch {
      continue;
    }
    const coloring = tutorialColoring(model);
    const coloured = colouredModel(model, coloring);
    const colors = pieceColors(coloured, coloring);
    const fill = byPlace(coloured) ? placeFills(coloured, coloring) : undefined;
    const { u, v } = coloured.pattern.cell;
    const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
    const sides = new Map<string, { colour: string; type: number }[]>();
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        coloured.pattern.pieces.forEach((p, k) => {
          const colour = fill ? fill(k, i, j) : (colors[p.type] ?? '');
          const dx = u.x * i + v.x * j;
          const dy = u.y * i + v.y * j;
          const ps = p.polygon.map((q) => key(q.x + dx, q.y + dy));
          ps.forEach((a, n) => {
            const b = ps[(n + 1) % ps.length] ?? a;
            const s = [a, b].sort().join('|');
            const list = sides.get(s) ?? [];
            list.push({ colour, type: p.type });
            sides.set(s, list);
          });
        });
    let shared = 0;
    let same = 0;
    let sameType = 0;
    let plain = 0;
    for (const list of sides.values()) {
      if (list.length !== 2) continue;
      shared++;
      const [a, b] = list;
      if (a && b && a.colour.toLowerCase() === b.colour.toLowerCase()) {
        same++;
        if (a.type === b.type) sameType++;
        const l = lightness(a.colour);
        if (l > 85 || l < 20) plain++;
      }
    }
    rows.push({
      id: f.replace('.json', ''),
      shared,
      same,
      sameType,
      share: shared ? same / shared : 0,
      plain,
      method: coloring.method ?? (byPlace(coloured) ? 'place' : 'shape'),
      kind: model.tutorial.pattern.rings
        ? 'rings'
        : model.tutorial.pattern.placements
          ? 'placements'
          : 'shape',
    });
  }
  writeFileSync(out as string, JSON.stringify(rows, null, 1));
}, 600_000);
