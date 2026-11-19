import { inset, isOnOutline, meshOf, standOn, topOf, type Mesh, type Pin } from './mesh.js';
import { partsOf, type Cuts } from './parts.js';
import type { MeshPart } from './relief.js';
import { signedArea, type P2, type P3 } from './skeleton.js';

/**
 * Moulds for a carved panel. A panel's face is a height over its outline,
 * so its mould is the same surface turned upside down and mirrored, set
 * in a box: plaster poured into it up to the rim and screeded flat comes
 * out as the panel, face down. Turned over, it reads the right way round.
 */
export interface MouldOptions {
  /** The mould's floor under the deepest point of the face. */
  readonly floor: number;
  /** The rim round the cavity. */
  readonly wall: number;
}

/**
 * The rigid mould for a panel whose top is `top` (from reliefTop) over
 * `outline`, `thickness` thick. The cavity holds exactly the panel: fill
 * it level with the rim.
 */
export function mouldOf(
  top: readonly (readonly P3[])[],
  outline: readonly P2[],
  thickness: number,
  { floor, wall }: MouldOptions,
): Mesh {
  if (!(floor > 0) || !(wall > 0)) throw new Error('A mould needs a floor and a rim.');
  const rim = floor + thickness;
  // Mirrored left to right, so the cast turned over reads as the panel.
  const cavity = top.map((f) =>
    f.map((p) => ({ x: -p.x, y: p.y, z: rim - p.z })).reverse(),
  );
  const inner = outline.map((p) => ({ x: -p.x, y: p.y })).reverse();
  const outer = inset(inner, -wall);
  return standOn(topOf({ surface: cavity, outline: outer, frame: wall, top: rim }), outer);
}

/**
 * A mould too large for the bed, as parts cut at `cuts` (in the mould's
 * own place, see `mouldOutline`), with its rim on the outer sides only
 * and pin holes at `pins` along the seams.
 */
export function mouldParts(
  top: readonly (readonly P3[])[],
  outline: readonly P2[],
  thickness: number,
  { floor, wall }: MouldOptions,
  cuts: Cuts,
  pins: readonly Pin[],
): MeshPart[] {
  if (!(floor > 0) || !(wall > 0)) throw new Error('A mould needs a floor and a rim.');
  const rim = floor + thickness;
  const cavity = top.map((f) =>
    f.map((p) => ({ x: -p.x, y: p.y, z: rim - p.z })).reverse(),
  );
  const outer = mouldOutline(outline, wall);
  const solid = { surface: cavity, outline: outer, frame: wall, top: rim };
  return partsOf(outer, cuts).map((part) => {
    const mine = pins.filter((p) => isOnOutline(p.centre, part.outline) && !isOnOutline(p.centre, outer));
    return {
      name: part.name,
      column: part.column,
      row: part.row,
      mesh: standOn(topOf(solid, part.cell), part.outline, 0, mine),
      outline: part.outline,
      pins: mine.length,
    };
  });
}

/** The outline of a mould round a panel (mirrored, with its rim). */
export function mouldOutline(outline: readonly P2[], wall: number): P2[] {
  return inset(outline.map((p) => ({ x: -p.x, y: p.y })).reverse(), -wall);
}

export interface BoxOptions {
  /** Silicone between the master and the box's walls. */
  readonly gap: number;
  /** Silicone over the master's highest point. */
  readonly cover: number;
  /** The box's walls. */
  readonly wall: number;
}

/**
 * An open box (four walls, no floor) to stand round a printed master on a
 * flat board and pour silicone into, for a flexible mould.
 */
export function mouldBox(
  outline: readonly P2[],
  thickness: number,
  { gap, cover, wall }: BoxOptions,
): Mesh {
  if (!(gap > 0) || !(cover > 0) || !(wall > 0))
    throw new Error('A mould box needs room round the master and walls.');
  const height = thickness + cover;
  const inner = inset(outline, -gap);
  const outer = inset(outline, -(gap + wall));
  const at = (p: P2, z: number): P3 => ({ x: p.x, y: p.y, z });
  const faces: P3[][] = [];
  const m = outline.length;
  for (let i = 0; i < m; i++) {
    const k = (i + 1) % m;
    faces.push([at(outer[i]!, height), at(outer[k]!, height), at(inner[k]!, height), at(inner[i]!, height)]);
    faces.push([at(inner[i]!, 0), at(inner[k]!, 0), at(outer[k]!, 0), at(outer[i]!, 0)]);
    faces.push([at(outer[i]!, height), at(outer[i]!, 0), at(outer[k]!, 0), at(outer[k]!, height)]);
    faces.push([at(inner[k]!, height), at(inner[k]!, 0), at(inner[i]!, 0), at(inner[i]!, height)]);
  }
  return meshOf(faces);
}

/** How much silicone fills a box round a master of `volume` (mm³). */
export function siliconeFor(
  outline: readonly P2[],
  thickness: number,
  volume: number,
  { gap, cover }: Pick<BoxOptions, 'gap' | 'cover'>,
): number {
  return signedArea(inset(outline, -gap)) * (thickness + cover) - volume;
}

/** The outline of a mould box round a panel. */
export function boxOutline(outline: readonly P2[], { gap, wall }: Pick<BoxOptions, 'gap' | 'wall'>): P2[] {
  return inset(outline, -(gap + wall));
}

/**
 * Grams of plaster and of water for a cast of `volume` mm³, mixed with
 * `water` grams of water to 100 g of plaster (the bag says; moulding
 * plaster is about 70). Plaster's powder is 2.63 g/cm³.
 */
export function plasterFor(volume: number, water: number): { plaster: number; water: number } {
  const ml = volume / 1000;
  const plaster = ml / (1 / 2.63 + water / 100);
  return { plaster, water: (plaster * water) / 100 };
}

/**
 * Walls of a panel too near upright to slide out of a rigid mould: the
 * area (mm²) of faces leaning less than `draft` degrees, leaving out the
 * outer sides, which stand on the outline.
 */
export function uprightArea(mesh: Mesh, outline: readonly P2[], draft: number): number {
  const { positions: p, triangles: t } = mesh;
  const limit = Math.sin((draft * Math.PI) / 180);
  const onEdge = (i: number) => {
    const x = p[i * 3]!;
    const y = p[i * 3 + 1]!;
    for (let k = 0; k < outline.length; k++) {
      const a = outline[k]!;
      const b = outline[(k + 1) % outline.length]!;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (Math.abs((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)) / len < 1e-4) return true;
    }
    return false;
  };
  let area = 0;
  for (let i = 0; i < t.length; i += 3) {
    const [a, b, c] = [t[i]!, t[i + 1]!, t[i + 2]!];
    const ux = p[b * 3]! - p[a * 3]!;
    const uy = p[b * 3 + 1]! - p[a * 3 + 1]!;
    const uz = p[b * 3 + 2]! - p[a * 3 + 2]!;
    const vx = p[c * 3]! - p[a * 3]!;
    const vy = p[c * 3 + 1]! - p[a * 3 + 1]!;
    const vz = p[c * 3 + 2]! - p[a * 3 + 2]!;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len === 0 || nz / len >= limit || nz / len < -1e-9) continue;
    if (onEdge(a) && onEdge(b) && onEdge(c)) continue;
    area += len / 2;
  }
  return area;
}
