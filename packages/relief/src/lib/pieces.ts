import { clip, convexParts, inset, meshOf, volumeOf, type Mesh } from './mesh.js';
import { boundary } from './flat.js';
import type { Cuts } from './parts.js';
import { panelParts, piecesOver, type MeshPart, type PatternShape } from './relief.js';
import { signedArea, sweep, type P2, type P3 } from './skeleton.js';

/**
 * Tile pieces: every piece of the pattern printed on its own, to be laid
 * side by side into the pattern, the way zellige is set. Each piece is
 * the pattern's polygon cut to the panel's outline, shrunk by half the
 * joint on every side, with a bevel round its top edge and a pocket in
 * its bottom for a disc magnet. The shrinking, the bevel and the
 * magnet's place all come from the piece's straight skeleton, so a
 * concave star shrinks exactly and its pocket sits where its walls are
 * thickest.
 */

/** A disc magnet, in millimetres. */
export interface Magnet {
  readonly across: number;
  readonly thick: number;
}

/** The disc magnets the page offers, the common size first. */
export const MAGNETS: Readonly<Record<'6x2' | '5x2' | '3x1', Magnet>> = {
  '6x2': { across: 6, thick: 2 },
  '5x2': { across: 5, thick: 2 },
  '3x1': { across: 3, thick: 1 },
};
/** The smallest magnet, for pieces too small for the one chosen. */
export const SMALL_MAGNET = MAGNETS['3x1'];
/** A pocket is this much wider and deeper than its magnet. */
export const MAGNET_ROOM = 0.2;
/** The plastic kept round a pocket, and over it. */
export const MAGNET_WALL = 1.2;
export const MAGNET_ROOF = 1;
/** The pocket's sides: a polygon round the magnet's circle. */
const POCKET_SIDES = 24;
/** Cut pieces smaller than this across (their largest circle) are left
 * out: a sliver at the edge that would not print. */
export const SLIVER = 1;

export interface PieceOptions {
  /** The panel's outline: convex, counter-clockwise, in millimetres. */
  readonly outline: readonly P2[];
  /** Millimetres for one pattern unit. */
  readonly scale: number;
  /** A border this wide, printed as strips. */
  readonly frame: number;
  readonly thickness: number;
  /** The gap between two pieces: each loses half of it on every side. */
  readonly joint: number;
  /** The bevel round each piece's top edge, at 45° (0 for none). */
  readonly bevel: number;
  /** The magnet each piece takes where it fits; none when left out. */
  readonly magnet?: Magnet;
  /** The colour of the k-th piece of the tile copied i times along u and
   * j times along v, as the wall shows it. */
  readonly colour: (k: number, i: number, j: number) => string;
  readonly frameColour: string;
  /** The longest frame strip (the bed less room for a brim). */
  readonly longest?: number;
}

export interface TilePiece {
  /** The engine's piece type, or -1 for a frame strip. */
  readonly type: number;
  readonly colour: string;
  /** The piece as printed, seen from above, in its place. */
  readonly outline: P2[];
  /** Whether the panel's outline cut it. */
  readonly cut: boolean;
  /** The diameter of the largest circle inside it. */
  readonly across: number;
  /** Its magnet and where, if one fits. */
  readonly magnet?: Magnet;
  readonly at?: P2;
  /** The closed solid, in its place on the panel. */
  readonly mesh: Mesh;
}

export interface PieceSet {
  readonly pieces: TilePiece[];
  /** Cut slivers left out, and their area before shrinking. */
  readonly dropped: number;
  readonly droppedArea: number;
  /** The smallest whole piece's largest circle, across. */
  readonly smallest: number;
}

/** Every piece of a panel, ready to print. */
export function tilePieces(pattern: PatternShape, o: PieceOptions): PieceSet {
  const { outline } = o;
  if (o.magnet && o.thickness < o.magnet.thick + MAGNET_ROOM + MAGNET_ROOF)
    throw new Error(
      `A ${o.magnet.across} × ${o.magnet.thick} mm magnet needs pieces at least ${o.magnet.thick + MAGNET_ROOM + MAGNET_ROOF} mm thick.`,
    );
  const inner = o.frame > 0 ? inset(outline, o.frame) : outline.slice();
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  const half = {
    x: Math.max(...xs.map(Math.abs)),
    y: Math.max(...ys.map(Math.abs)),
  };
  const pieces: TilePiece[] = [];
  let dropped = 0;
  let droppedArea = 0;
  let smallest = Infinity;
  const add = (polygon: P2[], type: number, colour: string, cut: boolean) => {
    const shapes = shrunk(polygon, o.joint / 2);
    const sizes = shapes.map(deepest);
    if (cut && sizes.every((d) => 2 * d.radius < SLIVER)) {
      dropped++;
      droppedArea += signedArea(polygon);
      return;
    }
    for (const [n, shape] of shapes.entries()) {
      const { radius, centre } = sizes[n]!;
      if (cut && 2 * radius < SLIVER) continue;
      if (!cut && type >= 0) smallest = Math.min(smallest, 2 * radius);
      const magnet = magnetFor(radius, o.magnet);
      pieces.push({
        type,
        colour,
        outline: shape,
        cut,
        across: 2 * radius,
        ...(magnet ? { magnet, at: centre } : {}),
        mesh: pieceSolid(shape, o.thickness, o.bevel, magnet ? { magnet, at: centre } : undefined),
      });
    }
  };
  for (const piece of piecesOver(pattern, o.scale, half)) {
    const colour = o.colour(piece.k, piece.i, piece.j);
    const inside = piece.polygon.every((p) => within(p, inner));
    if (inside) {
      add(piece.polygon, piece.type, colour, false);
      continue;
    }
    for (const part of cutTo(piece.polygon, inner)) add(part, piece.type, colour, true);
  }
  if (o.frame > 0)
    for (const strip of frameStrips(outline, o.frame, o.longest ?? 240)) add(strip, -1, o.frameColour, false);
  return { pieces, dropped, droppedArea, smallest: Number.isFinite(smallest) ? smallest : 0 };
}

/** Is p inside the convex outline (or on it)? */
function within(p: P2, outline: readonly P2[]): boolean {
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) < -1e-7 * len) return false;
  }
  return true;
}

/** A piece cut to a convex outline: what is left inside, as one or more
 * counter-clockwise polygons. */
export function cutTo(polygon: readonly P2[], outline: readonly P2[]): P2[][] {
  const parts: P3[][] = [];
  for (const part of convexParts(polygon.map((p) => ({ ...p, z: 0 })))) {
    const c = clip(part, outline);
    if (c.length >= 3 && Math.abs(signedArea(c)) > 1e-9) parts.push(c);
  }
  return boundary(parts).filter((l) => signedArea(l) > 0);
}

/** A polygon moved in by d on every side: what is left of it, which a
 * narrow waist may cut in two. */
export function shrunk(polygon: readonly P2[], d: number): P2[][] {
  if (d <= 0) return [polygon.slice()];
  return sweep(polygon, [], d).floor.map((l) => l.slice());
}

/** The largest circle inside a polygon: its radius is how far the
 * wavefront goes before it closes, and its centre is where it closes
 * last (the middle of those points, when a ridge closes at once). */
export function deepest(polygon: readonly P2[]): { radius: number; centre: P2 } {
  const s = sweep(polygon, [], Infinity);
  const radius = s.reached;
  const top: P2[] = [];
  for (const f of s.faces)
    for (const p of f) if (Math.abs(p.z - radius) <= 1e-7 * Math.max(1, radius)) top.push(p);
  if (!top.length) return { radius, centre: polygon[0]! };
  const mid = {
    x: top.reduce((a, p) => a + p.x, 0) / top.length,
    y: top.reduce((a, p) => a + p.y, 0) / top.length,
  };
  // Their middle when it is as deep (the middle of one ridge), else the
  // point at the top nearest it (one of two separate peaks).
  if (inPolygon(mid, polygon) && sideDistance(mid, polygon) >= radius * (1 - 1e-9) - 1e-12)
    return { radius, centre: mid };
  let centre = top[0]!;
  for (const p of top)
    if (Math.hypot(p.x - mid.x, p.y - mid.y) < Math.hypot(centre.x - mid.x, centre.y - mid.y)) centre = p;
  return { radius, centre: { x: centre.x, y: centre.y } };
}

/** How far p is from the nearest side of a polygon. */
function sideDistance(p: P2, polygon: readonly P2[]): number {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / (ab.x ** 2 + ab.y ** 2)));
    best = Math.min(best, Math.hypot(p.x - a.x - ab.x * t, p.y - a.y - ab.y * t));
  }
  return best;
}

/** Is p inside a polygon? */
function inPolygon(p: P2, polygon: readonly P2[]): boolean {
  let c = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/** The pocket's corners: a polygon whose sides touch the circle the
 * magnet needs, so the magnet fits between them. */
function pocketOf(magnet: Magnet, at: P2): P2[] {
  const r = (magnet.across + MAGNET_ROOM) / 2 / Math.cos(Math.PI / POCKET_SIDES);
  return Array.from({ length: POCKET_SIDES }, (_, i) => {
    const a = (2 * Math.PI * i) / POCKET_SIDES;
    return { x: at.x + r * Math.cos(a), y: at.y + r * Math.sin(a) };
  });
}

/** How far a pocket reaches from its centre, wall included. */
export function pocketReach(magnet: Magnet): number {
  return (magnet.across + MAGNET_ROOM) / 2 / Math.cos(Math.PI / POCKET_SIDES) + MAGNET_WALL;
}

/** The magnet a piece with this largest circle takes: the one chosen,
 * else the smallest, else none. */
export function magnetFor(radius: number, chosen: Magnet | undefined): Magnet | undefined {
  if (!chosen) return undefined;
  if (radius >= pocketReach(chosen)) return chosen;
  if (radius >= pocketReach(SMALL_MAGNET)) return SMALL_MAGNET;
  return undefined;
}

/**
 * One piece as a closed solid standing on z = 0: a flat top at
 * `thickness`, a 45° bevel round it, upright sides, and a bottom with the
 * magnet's pocket.
 */
export function pieceSolid(
  shape: readonly P2[],
  thickness: number,
  bevel: number,
  pocket?: { magnet: Magnet; at: P2 },
): Mesh {
  const faces: P3[][] = [];
  const b = Math.min(bevel, thickness / 2);
  const side = thickness - b;
  if (b > 0) {
    const s = sweep(shape, [], b);
    for (const f of s.faces) faces.push(f.map((p) => ({ x: p.x, y: p.y, z: side + p.z })));
    for (const f of s.floor) faces.push(f.map((p) => ({ ...p, z: thickness })));
  } else faces.push(shape.map((p) => ({ ...p, z: thickness })));
  const n = shape.length;
  for (let i = 0; i < n; i++) {
    const a = shape[i]!;
    const c = shape[(i + 1) % n]!;
    faces.push([
      { ...a, z: 0 },
      { ...c, z: 0 },
      { ...c, z: side },
      { ...a, z: side },
    ]);
  }
  const bottom = shape.map((p) => ({ ...p, z: 0 })).reverse();
  if (!pocket) {
    faces.push(bottom);
    return meshOf(faces);
  }
  const hole = pocketOf(pocket.magnet, pocket.at);
  const depth = pocket.magnet.thick + MAGNET_ROOM;
  const m = hole.length;
  for (let i = 0; i < m; i++) {
    const a = hole[i]!;
    const c = hole[(i + 1) % m]!;
    faces.push([
      { ...c, z: 0 },
      { ...a, z: 0 },
      { ...a, z: depth },
      { ...c, z: depth },
    ]);
  }
  faces.push(hole.map((p) => ({ ...p, z: depth })).reverse());
  faces.push(...aroundHole(bottom, hole.map((p) => ({ ...p, z: 0 }))));
  return meshOf(faces);
}

/**
 * A face with a hole as two faces without one: the outer loop (clockwise
 * seen from above, for a face looking down) is joined to the hole
 * (counter-clockwise) by two bridges on opposite sides of the hole, each
 * between corners that see each other, and the face is cut along them.
 */
function aroundHole(outer: readonly P3[], hole: readonly P3[]): P3[][] {
  const crosses = (p: P2, q: P2, also: readonly (readonly [P2, P2])[] = []) => {
    const edges: [P2, P2][] = [];
    for (const loop of [outer, hole])
      for (let i = 0; i < loop.length; i++) edges.push([loop[i]!, loop[(i + 1) % loop.length]!]);
    for (const [a, b] of [...edges, ...also]) {
      if (a === p || b === p || a === q || b === q) continue;
      const d1 = turn(p, q, a);
      const d2 = turn(p, q, b);
      const d3 = turn(a, b, p);
      const d4 = turn(a, b, q);
      if (d1 * d2 < 0 && d3 * d4 < 0) return true;
    }
    return false;
  };
  const nearest = (h: number, skip: number, also: readonly (readonly [P2, P2])[]) => {
    let best = -1;
    let d = Infinity;
    outer.forEach((p, o) => {
      if (o === skip) return;
      const e = Math.hypot(p.x - hole[h]!.x, p.y - hole[h]!.y);
      if (e < d && !crosses(p, hole[h]!, also)) {
        d = e;
        best = o;
      }
    });
    return best;
  };
  const m = hole.length;
  for (let h1 = 0; h1 < m / 2; h1++) {
    const o1 = nearest(h1, -1, []);
    if (o1 < 0) continue;
    const h2 = (h1 + m / 2) % m;
    const o2 = nearest(h2, o1, [[outer[o1]!, hole[h1]!]]);
    if (o2 < 0) continue;
    const run = <T>(loop: readonly T[], from: number, to: number) => {
      const out: T[] = [];
      for (let i = from; ; i = (i + 1) % loop.length) {
        out.push(loop[i]!);
        if (i === to) break;
      }
      return out;
    };
    return [
      [...run(outer, o1, o2), ...run(hole, h2, h1)],
      [...run(outer, o2, o1), ...run(hole, h1, h2)],
    ];
  }
  throw new Error('A magnet pocket could not be joined to its piece.');
}

const turn = (a: P2, b: P2, c: P2) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/**
 * The frame round a panel as strips, mitred at its corners like a
 * picture frame: one strip to each side of a panel, sides that turn
 * gently (a round one) joined into arcs, and any strip longer than
 * `longest` cut square across.
 */
export function frameStrips(outline: readonly P2[], frame: number, longest: number): P2[][] {
  const inner = inset(outline, frame);
  const n = outline.length;
  const units: { outer: P2[]; inner: P2[]; dir: P2 }[] = [];
  const turnAt = (i: number) => {
    const a = outline[(i - 1 + n) % n]!;
    const b = outline[i]!;
    const c = outline[(i + 1) % n]!;
    const u = { x: b.x - a.x, y: b.y - a.y };
    const v = { x: c.x - b.x, y: c.y - b.y };
    return Math.atan2(u.x * v.y - u.y * v.x, u.x * v.x + u.y * v.y);
  };
  const SHARP = Math.PI / 6;
  // Start after a sharp corner, so no strip runs round one.
  let start = 0;
  for (let i = 0; i < n; i++)
    if (turnAt(i) >= SHARP) {
      start = i;
      break;
    }
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    const a = outline[i]!;
    const b = outline[(i + 1) % n]!;
    const ia = inner[i]!;
    const ib = inner[(i + 1) % n]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    const normal = { x: -dir.y, y: dir.x };
    const pieces = Math.ceil(len / longest);
    let prevOuter = a;
    let prevInner = ia;
    for (let p = 1; p <= pieces; p++) {
      const endOuter = p === pieces ? b : { x: a.x + (dir.x * len * p) / pieces, y: a.y + (dir.y * len * p) / pieces };
      const endInner =
        p === pieces ? ib : { x: endOuter.x + normal.x * frame, y: endOuter.y + normal.y * frame };
      units.push({ outer: [prevOuter, endOuter], inner: [prevInner, endInner], dir });
      prevOuter = endOuter;
      prevInner = endInner;
    }
  }
  // Join units across gentle corners while the strip stays short.
  const strips: { outer: P2[]; inner: P2[]; first: P2; turned: number }[] = [];
  for (const u of units) {
    const last = strips[strips.length - 1];
    if (last) {
      const prev = last.outer;
      const d = { x: prev[prev.length - 1]!.x - prev[prev.length - 2]!.x, y: prev[prev.length - 1]!.y - prev[prev.length - 2]!.y };
      const t = Math.atan2(d.x * u.dir.y - d.y * u.dir.x, d.x * u.dir.x + d.y * u.dir.y);
      const joined = [...last.outer, u.outer[1]!, ...last.inner];
      const xs = joined.map((p) => p.x);
      const ys = joined.map((p) => p.y);
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      if (Math.abs(t) > 1e-9 && Math.abs(t) < SHARP && Math.abs(last.turned + t) <= Math.PI / 2 + 1e-9 && size <= longest) {
        last.outer.push(u.outer[1]!);
        last.inner.push(u.inner[1]!);
        last.turned += t;
        continue;
      }
    }
    strips.push({ outer: u.outer.slice(), inner: u.inner.slice(), first: u.dir, turned: 0 });
  }
  return strips.map((s) => [...s.outer, ...s.inner.slice().reverse()]);
}

export interface PlateItem {
  /** The piece's place in the set. */
  readonly piece: number;
  /** Turned by this (radians) and moved by this, onto the plate. */
  readonly angle: number;
  readonly shift: P2;
}

export interface Plate {
  readonly colour: string;
  readonly items: PlateItem[];
}

/** The pieces packed onto plates, one colour to a plate: each piece
 * turned so its box is smallest and lies long side across, then set in
 * rows from the tallest down, `gap` apart, the whole centred on a bed
 * `bed` wide whose usable square is `size`. */
export function plates(
  set: readonly TilePiece[],
  size = 250,
  gap = 4,
  bed = 256,
): Plate[] {
  const byColour = new Map<string, number[]>();
  set.forEach((p, k) => byColour.set(p.colour, [...(byColour.get(p.colour) ?? []), k]));
  const out: Plate[] = [];
  for (const [colour, list] of byColour) {
    const boxes = list.map((k) => {
      const { angle, box } = bestTurn(set[k]!.outline);
      return { k, angle, box };
    });
    boxes.sort((a, b) => b.box.h - a.box.h || b.box.w - a.box.w);
    let plate: (PlateItem & { x: number; y: number; w: number; h: number })[] = [];
    let x = 0;
    let y = 0;
    let row = 0;
    const finish = () => {
      if (!plate.length) return;
      const w = Math.max(...plate.map((p) => p.x + p.w));
      const h = Math.max(...plate.map((p) => p.y + p.h));
      const dx = (bed - w) / 2;
      const dy = (bed - h) / 2;
      out.push({
        colour,
        items: plate.map((p) => ({ piece: p.piece, angle: p.angle, shift: { x: p.shift.x + dx, y: p.shift.y + dy } })),
      });
      plate = [];
    };
    for (const { k, angle, box } of boxes) {
      if (box.w > size || box.h > size)
        throw new Error(`A piece ${Math.round(box.w)} × ${Math.round(box.h)} mm is larger than the bed.`);
      if (x > 0 && x + box.w > size) {
        x = 0;
        y += row + gap;
        row = 0;
      }
      if (y + box.h > size) {
        finish();
        x = 0;
        y = 0;
        row = 0;
      }
      plate.push({ piece: k, angle, shift: { x: x - box.x, y: y - box.y }, x, y, w: box.w, h: box.h });
      x += box.w + gap;
      row = Math.max(row, box.h);
    }
    finish();
  }
  return out;
}

/** The turn that gives a polygon its smallest box, long side across. */
function bestTurn(polygon: readonly P2[]): { angle: number; box: { x: number; y: number; w: number; h: number } } {
  let best: { angle: number; box: { x: number; y: number; w: number; h: number } } | undefined;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % n]!;
    for (const extra of [0, Math.PI / 2]) {
      const angle = -Math.atan2(b.y - a.y, b.x - a.x) + extra;
      const box = boxOf(polygon.map((p) => turned(p, angle)));
      if (box.h > box.w + 1e-9) continue;
      if (!best || box.w * box.h < best.box.w * best.box.h - 1e-9) best = { angle, box };
    }
  }
  return best!;
}

function turned(p: P2, angle: number): P2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

function boxOf(ps: readonly P2[]) {
  const xs = ps.map((p) => p.x);
  const ys = ps.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** A mesh turned about the origin and moved. */
export function placed(mesh: Mesh, angle: number, shift: P2): Mesh {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const p = mesh.positions;
  const positions = new Float64Array(p.length);
  for (let i = 0; i < p.length; i += 3) {
    positions[i] = p[i]! * c - p[i + 1]! * s + shift.x;
    positions[i + 1] = p[i]! * s + p[i + 1]! * c + shift.y;
    positions[i + 2] = p[i + 2]!;
  }
  return { positions, triangles: mesh.triangles };
}

/** A shrunk piece's outline turned and moved as on its plate. */
export function placedOutline(outline: readonly P2[], item: PlateItem): P2[] {
  return outline.map((p) => {
    const q = turned(p, item.angle);
    return { x: q.x + item.shift.x, y: q.y + item.shift.y };
  });
}

/** The tray's rim, floor and the height of its rim above the floor. */
export const TRAY = { wall: 4, floor: 1.2, rim: 3 } as const;

/** The outline of a tray holding a panel's pieces. */
export const trayOutline = (outline: readonly P2[], joint: number) =>
  inset(outline, -(joint / 2 + TRAY.wall));

/**
 * A low tray the pieces are laid in: a floor with a rim round it, its
 * inside the panel's outline grown by half a joint, so the outer pieces
 * (each shrunk by half a joint) fit with the same joint against the rim.
 * Cut into parts when it is larger than the bed.
 */
export function tray(outline: readonly P2[], joint: number, cuts: Cuts): MeshPart[] {
  const outer = trayOutline(outline, joint);
  const surface = [outer.map((p) => ({ ...p, z: TRAY.floor }))];
  return panelParts(surface, outer, { frame: TRAY.wall, thickness: TRAY.floor + TRAY.rim }, cuts, []);
}

/** The volume of a set of pieces, in mm³. */
export const piecesVolume = (set: readonly TilePiece[]) =>
  set.reduce((v, p) => v + volumeOf(p.mesh), 0);

const num = (x: number) => String(Math.round(x * 100) / 100);

/** Light or dark text over a colour. */
function inkOver(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return '#000';
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map((x) => parseInt(x, 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#1d1d1b' : '#fbf8f1';
}

/**
 * The layout at full size, to print on paper and lay the pieces over:
 * the panel's outline, and every piece in its colour with its number,
 * counted from the top left. The numbers are those of the pieces in the
 * plates' files.
 */
export function layoutSvg(set: readonly TilePiece[], outline: readonly P2[], title = 'Tastir'): string {
  const all = [...outline, ...set.flatMap((p) => p.outline)];
  const { x: x0, y: y0, w, h } = boxOf(all);
  const y1 = y0 + h;
  const pad = 5;
  const order = numbering(set);
  const at = (p: P2) => `${num(p.x - x0 + pad)} ${num(y1 - p.y + pad)}`;
  const path = (loop: readonly P2[]) => 'M' + loop.map(at).join(' L') + ' Z';
  const rows: string[] = [];
  set.forEach((p, k) => {
    const label = deepest(p.outline);
    const size = Math.max(0.8, Math.min(4, label.radius * 0.9));
    rows.push(
      `<path d="${path(p.outline)}" fill="${p.colour}" stroke="#1d1d1b" stroke-width="0.15"/>`,
      `<text x="${num(label.centre.x - x0 + pad)}" y="${num(y1 - label.centre.y + pad + size * 0.35)}" font-size="${num(size)}" fill="${inkOver(p.colour)}">${order[k]}</text>`,
    );
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${num(w + 2 * pad)}mm" height="${num(h + 2 * pad)}mm" viewBox="0 0 ${num(w + 2 * pad)} ${num(h + 2 * pad)}">\n` +
    `<title>${title.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)}</title>\n` +
    `<path d="${path(outline)}" fill="none" stroke="#1d1d1b" stroke-width="0.3" stroke-dasharray="2 1"/>\n` +
    `<g font-family="sans-serif" text-anchor="middle">\n${rows.join('\n')}\n</g>\n` +
    `<text x="${pad}" y="${num(h + 2 * pad - 1.5)}" font-family="sans-serif" font-size="3" fill="#1d1d1b">${title.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)}: print at 100%, then lay each piece on its place.</text>\n` +
    '</svg>\n'
  );
}

/** Each piece's number: 1 at the top left, along rows from the top down. */
export function numbering(set: readonly TilePiece[]): number[] {
  const centres = set.map((p, k) => {
    const b = boxOf(p.outline);
    return { k, x: b.x + b.w / 2, y: b.y + b.h / 2, h: b.h };
  });
  const tallest = Math.max(1, ...centres.map((c) => c.h));
  // Rows half the tallest piece high, so a row reads as one line.
  const band = tallest / 2;
  centres.sort((a, b) => Math.floor(-a.y / band) - Math.floor(-b.y / band) || a.x - b.x);
  const out: number[] = new Array(set.length);
  centres.forEach((c, n) => (out[c.k] = n + 1));
  return out;
}
