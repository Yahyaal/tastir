import {
  depthOf,
  mouldBox,
  mouldOutline,
  mouldParts,
  panelParts,
  PIN_ROOM,
  pinsFor,
  reliefSurface,
  topOf,
  type BandShape,
  type Cuts,
  type MeshPart,
  mouldOf,
  openEdges,
  standOn,
  uprightArea,
  volumeOf,
  type Carving,
  type Mesh,
  type P2,
  type PatternShape,
} from '@tastir/relief';

/** What is printed: the object itself (to keep, or as a master), a rigid
 * mould to cast plaster in, or a box to pour silicone round the master. */
export type Print = 'object' | 'mould' | 'box';

export interface CarveRequest {
  readonly pattern: PatternShape;
  readonly outline: readonly P2[];
  readonly scale: number;
  readonly thickness: number;
  readonly band: number;
  readonly frame: number;
  readonly bands: BandShape;
  /** The weave's gap, or 0 for bands that do not weave. */
  readonly weaveGap: number;
  /** The carving of each piece type; -1 for any type not listed. */
  readonly carvings: Readonly<Record<number, Carving>>;
  readonly print: Print;
  /** The mould's floor and rim. */
  readonly floor: number;
  readonly wall: number;
  /** Silicone round and over the master. */
  readonly gap: number;
  readonly cover: number;
  /** Where what is printed is cut into parts for the bed, in its own
   * place (a mould is mirrored); no cuts for one piece. */
  readonly cuts: Cuts;
}

/** Walls leaning less than this from upright stick in a rigid mould. */
export const MOULD_DRAFT = 3;
/** The walls of a silicone box. */
export const BOX_WALL = 2.4;
/** A mould in parts has at least this floor, so its pins fit. */
export const SPLIT_FLOOR = 4;
/** Parts lie this far apart in the view and in the 3MF. */
const APART = 12;

export interface Part3D {
  readonly name: string;
  /** Moved apart from its neighbours by APART, as shown. */
  readonly mesh: Mesh;
  readonly pins: number;
  readonly width: number;
  readonly height: number;
}

export interface Carving3D {
  /** What is printed. */
  readonly mesh: Mesh;
  /** The object itself, shown in its box when the box is printed. */
  readonly master?: Mesh;
  /** Of what is printed, and of the object (the cast), in mm³. */
  readonly volume: number;
  readonly cast: number;
  /** Walls of the object nearer upright than MOULD_DRAFT, in mm². */
  readonly upright: number;
  /** What is printed, in parts for the bed, when it is cut. */
  readonly parts?: readonly Part3D[];
  /** How many pins join the parts (none when the solid is too thin). */
  readonly pins?: number;
}

export function carve(r: CarveRequest): Carving3D {
  const options = {
    width: 0,
    height: 0,
    outline: r.outline,
    scale: r.scale,
    thickness: r.thickness,
    band: r.band,
    frame: r.frame,
    carving: (type: number) => r.carvings[type] ?? r.carvings[-1]!,
    bands: r.bands,
    gap: r.weaveGap,
  };
  const { surface, outline } = reliefSurface(r.pattern, options);
  const top = topOf({ surface, outline, frame: r.frame, top: r.thickness });
  const object = standOn(top, outline);
  const split = r.print !== 'box' && (r.cuts.xs.length > 0 || r.cuts.ys.length > 0);
  let parts: MeshPart[] | undefined;
  let pins = 0;
  if (split && r.print === 'mould') {
    const floor = Math.max(r.floor, SPLIT_FLOOR);
    const at = pinsFor(mouldOutline(outline, r.wall), r.cuts, floor / 2);
    parts = mouldParts(top, outline, r.thickness, { floor, wall: r.wall }, r.cuts, at);
    pins = at.length;
  } else if (split) {
    const deepest = Math.max(...Object.values(r.carvings).map(depthOf));
    const room = r.thickness - deepest;
    const at = room >= PIN_ROOM ? pinsFor(outline, r.cuts, room / 2) : [];
    parts = panelParts(surface, outline, r, r.cuts, at);
    pins = at.length;
  }
  const whole =
    r.print === 'mould'
      ? mouldOf(top, outline, r.thickness, { floor: r.floor, wall: r.wall })
      : r.print === 'box'
        ? mouldBox(outline, r.thickness, { gap: r.gap, cover: r.cover, wall: BOX_WALL })
        : object;
  const apart = parts ? spread(parts, r.cuts) : undefined;
  for (const m of [object, whole, ...(apart ?? []).map((p) => p.mesh)]) {
    const open = openEdges(m);
    if (open) throw new Error(`The mesh has ${open} open edges.`);
  }
  const mesh = apart ? joinMeshes(apart.map((p) => p.mesh)) : whole;
  return {
    mesh,
    ...(r.print === 'box' ? { master: object } : {}),
    volume: volumeOf(mesh),
    cast: volumeOf(object),
    upright: r.print === 'mould' ? uprightArea(object, outline, MOULD_DRAFT) : 0,
    ...(apart ? { parts: apart, pins } : {}),
  };
}

/** The parts moved apart, each by APART from the next, so the seams show. */
function spread(parts: readonly MeshPart[], cuts: Cuts): Part3D[] {
  const columns = cuts.xs.length + 1;
  const rows = cuts.ys.length + 1;
  return parts.map(({ column, row, ...part }) => {
    const dx = (column - (columns - 1) / 2) * APART;
    const dy = -(row - (rows - 1) / 2) * APART;
    const positions = Float64Array.from(part.mesh.positions, (v, i) =>
      i % 3 === 0 ? v + dx : i % 3 === 1 ? v + dy : v,
    );
    const xs = part.outline.map((p) => p.x);
    const ys = part.outline.map((p) => p.y);
    return {
      name: part.name,
      mesh: { positions, triangles: part.mesh.triangles },
      pins: part.pins,
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  });
}

/** Several meshes as one. */
export function joinMeshes(meshes: readonly Mesh[]): Mesh {
  const positions = new Float64Array(meshes.reduce((n, m) => n + m.positions.length, 0));
  const triangles = new Uint32Array(meshes.reduce((n, m) => n + m.triangles.length, 0));
  let p = 0;
  let t = 0;
  for (const m of meshes) {
    positions.set(m.positions, p);
    const shift = p / 3;
    for (let i = 0; i < m.triangles.length; i++) triangles[t + i] = m.triangles[i]! + shift;
    p += m.positions.length;
    t += m.triangles.length;
  }
  return { positions, triangles };
}
