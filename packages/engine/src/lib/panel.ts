import type { Scene } from './evaluate.js';
import { TutorialError } from './evaluate.js';
import { clipToPreparedCell, prepareCell } from './freeInk.js';
import type { InkStroke } from './ink.js';
import type { Cell } from './pieces.js';
import { segment } from './shapes.js';
import { add, cross, dot, length, scale, sub, type Vec } from './vec.js';

/**
 * The whole panel a craftsman draws, for a tile that carries a shared band
 * on only two of its sides: a larger convex polygon round the tile, and the
 * ink of the tile and its copies inside it. It is only shown (traced in the
 * ink stage); the tile stays the repeating cell, so its copies overlap by
 * the difference.
 */
export interface Panel {
  readonly corners: readonly Vec[];
  readonly ink: readonly InkStroke[];
}

export function panelOf(
  scene: Scene,
  name: string,
  cell: Cell,
  ink: readonly InkStroke[],
): Panel {
  const { eps } = scene.tol;
  const fail = (reason: string): never => {
    throw new TutorialError('pattern', name, reason);
  };
  const g = scene.elements.get(name)?.geometry;
  if (g?.kind !== 'polygon') return fail('the panel must be a polygon');
  const corners = g.vertices;
  const n = corners.length;
  const at = (i: number) => corners[((i % n) + n) % n] as Vec;
  const turns = corners.map((_, i) =>
    cross(sub(at(i + 1), at(i)), sub(at(i + 2), at(i + 1))),
  );
  if (!turns.every((t) => t > eps) && !turns.every((t) => t < -eps))
    fail('the panel must be convex');
  const turn = Math.sign(turns[0] as number);
  const inside = (p: Vec) =>
    corners.every(
      (a, i) =>
        turn * cross(sub(at(i + 1), a), sub(p, a)) >=
        -eps * length(sub(at(i + 1), a)),
    );
  if (!cell.corners.every(inside)) fail('the panel must hold the whole tile');

  // The tile's ink and its neighbours', clipped to the panel.
  const boundary = prepareCell({ corners }, eps);
  const pieces: { a: Vec; b: Vec; from: string; to: string }[] = [];
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const shift = add(scale(cell.u, i), scale(cell.v, j));
      for (const s of ink) {
        const c = clipToPreparedCell(
          segment(add(s.segment.a, shift), add(s.segment.b, shift)),
          boundary,
        );
        if (c) pieces.push({ a: c.a, b: c.b, from: s.from, to: s.to });
      }
    }

  // Join the pieces along each straight line where they touch or overlap,
  // so a line crossing from the tile into a copy is one stroke.
  const groups = new Map<string, typeof pieces>();
  const key = (p: { a: Vec; b: Vec }) => {
    let d = sub(p.b, p.a);
    d = scale(d, 1 / length(d));
    if (d.x < -eps || (Math.abs(d.x) <= eps && d.y < 0)) d = scale(d, -1);
    const offset = cross(d, p.a);
    const r = (x: number) => (Math.abs(x) < 5e-7 ? 0 : x).toFixed(6);
    return `${r(d.x)},${r(d.y)},${r(offset)}`;
  };
  for (const p of pieces) {
    const k = key(p);
    const group = groups.get(k);
    if (group) group.push(p);
    else groups.set(k, [p]);
  }
  const out: InkStroke[] = [];
  for (const group of groups.values()) {
    const first = group[0] as (typeof pieces)[number];
    const d = scale(sub(first.b, first.a), 1 / length(sub(first.b, first.a)));
    const along = group
      .map((p) => {
        const ta = dot(sub(p.a, first.a), d);
        const tb = dot(sub(p.b, first.a), d);
        return ta <= tb
          ? { t0: ta, t1: tb, from: p.from, to: p.to }
          : { t0: tb, t1: ta, from: p.to, to: p.from };
      })
      .sort((p, q) => p.t0 - q.t0);
    let run = { ...(along[0] as (typeof along)[number]) };
    const flush = () =>
      out.push({
        from: run.from,
        to: run.to,
        segment: segment(
          add(first.a, scale(d, run.t0)),
          add(first.a, scale(d, run.t1)),
        ),
      });
    for (const p of along.slice(1)) {
      if (p.t0 <= run.t1 + eps) {
        if (p.t1 > run.t1) run = { ...run, t1: p.t1, to: p.to };
      } else {
        flush();
        run = { ...p };
      }
    }
    flush();
  }
  return { corners, ink: out };
}
