import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ARCH_KINDS,
  ARCH_NAMES,
  ARCH_OF_PLACE,
  ARCH_PATHS,
  archOf,
  PERSIAN_PATH,
  PISHTAQ_ARCH,
} from './arches';

type Pt = [number, number];

/** The point at t on a Bézier curve with these control points. */
function bezier(pts: readonly Pt[], t: number): Pt {
  if (pts.length === 1) return pts[0] ?? [0, 0];
  const lower = pts.slice(1).map((b, j): Pt => {
    const a = pts[j] ?? b;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
  return bezier(lower, t);
}

/**
 * Points along an SVG path of absolute M, L, H, V, A, C, Q and Z commands,
 * many to each curve, so a curve that bulges out of its box is caught.
 */
function sample(d: string): Pt[] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0;
  const num = () => Number(tokens[i++]);
  const out: Pt[] = [];
  let p: Pt = [0, 0];
  let start: Pt = [0, 0];
  let cmd = '';
  const N = 64;
  while (i < tokens.length) {
    const token = tokens[i] ?? '';
    if (/[A-Za-z]/.test(token)) {
      cmd = token;
      i++;
    }
    expect(cmd, `relative command in ${d}`).toMatch(/^[MLHVACQZ]$/);
    if (cmd === 'M') {
      p = start = [num(), num()];
      out.push(p);
    } else if (cmd === 'L') p = [num(), num()];
    else if (cmd === 'H') p = [num(), p[1]];
    else if (cmd === 'V') p = [p[0], num()];
    else if (cmd === 'Z') p = start;
    else if (cmd === 'C' || cmd === 'Q') {
      const pts: Pt[] = [p];
      const n = cmd === 'C' ? 3 : 2;
      for (let k = 0; k < n; k++) pts.push([num(), num()]);
      for (let s = 1; s <= N; s++) out.push(bezier(pts, s / N));
      p = pts[n] ?? p;
    } else if (cmd === 'A') {
      // The endpoint form to the centre form (SVG 1.1, appendix F.6), for
      // circles: the arches never rotate an ellipse.
      let r = num();
      num();
      num();
      const large = num();
      const sweep = num();
      const e: Pt = [num(), num()];
      const mx = (p[0] - e[0]) / 2;
      const my = (p[1] - e[1]) / 2;
      const h2 = mx * mx + my * my;
      r = Math.max(r, Math.sqrt(h2));
      const k =
        (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (r * r - h2) / h2));
      const c: Pt = [k * my + (p[0] + e[0]) / 2, -k * mx + (p[1] + e[1]) / 2];
      const a0 = Math.atan2(p[1] - c[1], p[0] - c[0]);
      let da = Math.atan2(e[1] - c[1], e[0] - c[0]) - a0;
      if (sweep && da < 0) da += 2 * Math.PI;
      if (!sweep && da > 0) da -= 2 * Math.PI;
      for (let s = 1; s <= N; s++) {
        const a = a0 + (da * s) / N;
        out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
      }
      p = e;
    }
    out.push(p);
  }
  return out;
}

describe('arches', () => {
  it.each(ARCH_KINDS)('the %s arch stays inside its 100 × 125 box', (kind) => {
    const pts = sample(ARCH_PATHS[kind]);
    for (const [x, y] of pts) {
      expect(x, `${kind} at (${x}, ${y})`).toBeGreaterThanOrEqual(-0.01);
      expect(x, `${kind} at (${x}, ${y})`).toBeLessThanOrEqual(100.01);
      expect(y, `${kind} at (${x}, ${y})`).toBeGreaterThanOrEqual(-0.01);
      expect(y, `${kind} at (${x}, ${y})`).toBeLessThanOrEqual(125.01);
    }
    // Each window stands on the whole width of its card, so a row lines up.
    expect(pts.some(([, y]) => y === 125)).toBe(true);
    // And reaches near the top of its box: no arch is left short.
    expect(Math.min(...pts.map(([, y]) => y))).toBeLessThan(12);
  });

  it("the Timurid portal's inner arch stays inside the portal", () => {
    const { x, y, sx, sy } = PISHTAQ_ARCH;
    for (const [px, py] of sample(PERSIAN_PATH)) {
      const [tx, ty] = [x + px * sx, y + py * sy];
      expect(tx).toBeGreaterThan(0);
      expect(tx).toBeLessThan(100);
      expect(ty).toBeGreaterThan(0);
      expect(ty).toBeLessThanOrEqual(125.01);
    }
  });

  it('every arch has a name and a path', () => {
    expect(Object.keys(ARCH_PATHS).sort()).toEqual([...ARCH_KINDS].sort());
    expect(Object.keys(ARCH_NAMES).sort()).toEqual([...ARCH_KINDS].sort());
  });

  it('takes the tradition first, then the place, then the round arch', () => {
    expect(archOf('Iran', 'Timurid')).toBe('pishtaq');
    expect(archOf('Iran', 'Islamic')).toBe('persian');
    expect(archOf('Books and other', 'Islamic')).toBe('round');
    expect(archOf(undefined, undefined)).toBe('round');
  });

  // Tests run from apps/player or from the repo root.
  const root = process.cwd().replace(/\/apps\/player$/, '');
  const dir = join(root, 'tutorials');
  const tutorials = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const t = JSON.parse(readFileSync(join(dir, f), 'utf8')) as {
        style?: string;
        region?: string;
        places?: { id: string; style?: string; region?: string }[];
      };
      return [
        { id: f.replace(/\.json$/, ''), style: t.style, region: t.region },
        ...(t.places ?? []).map((p) => ({
          id: p.id,
          style: p.style ?? t.style,
          region: p.region ?? t.region,
        })),
      ];
    });

  it('every tutorial and every place of one gets an arch', () => {
    expect(tutorials.length).toBeGreaterThan(200);
    // A place the table does not know would quietly fall back to the round
    // arch, so a new place must be added to ARCH_OF_PLACE (or here, when it
    // really has no arch of its own).
    const known = new Set([...Object.keys(ARCH_OF_PLACE), 'Books and other']);
    for (const t of tutorials) {
      expect(
        known.has(t.region ?? ''),
        `${t.id}: unknown region ${t.region}`,
      ).toBe(true);
      expect(ARCH_KINDS).toContain(archOf(t.region, t.style));
    }
  });

  it('gives a card of every arch to at least one tutorial', () => {
    const used = new Set(tutorials.map((t) => archOf(t.region, t.style)));
    expect([...used].sort()).toEqual([...ARCH_KINDS].sort());
  });
});
