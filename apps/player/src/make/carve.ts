import {
  mouldBox,
  mouldOf,
  openEdges,
  reliefTop,
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
  /** The carving of each piece type; -1 for any type not listed. */
  readonly carvings: Readonly<Record<number, Carving>>;
  readonly print: Print;
  /** The mould's floor and rim. */
  readonly floor: number;
  readonly wall: number;
  /** Silicone round and over the master. */
  readonly gap: number;
  readonly cover: number;
}

/** Walls leaning less than this from upright stick in a rigid mould. */
export const MOULD_DRAFT = 3;
/** The walls of a silicone box. */
export const BOX_WALL = 2.4;

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
}

export function carve(r: CarveRequest): Carving3D {
  const { top, outline } = reliefTop(r.pattern, {
    width: 0,
    height: 0,
    outline: r.outline,
    scale: r.scale,
    thickness: r.thickness,
    band: r.band,
    frame: r.frame,
    carving: (type) => r.carvings[type] ?? r.carvings[-1]!,
  });
  const object = standOn(top, outline);
  const mesh =
    r.print === 'mould'
      ? mouldOf(top, outline, r.thickness, { floor: r.floor, wall: r.wall })
      : r.print === 'box'
        ? mouldBox(outline, r.thickness, { gap: r.gap, cover: r.cover, wall: BOX_WALL })
        : object;
  for (const m of [object, mesh]) {
    const open = openEdges(m);
    if (open) throw new Error(`The mesh has ${open} open edges.`);
  }
  return {
    mesh,
    ...(r.print === 'box' ? { master: object } : {}),
    volume: volumeOf(mesh),
    cast: volumeOf(object),
    upright: r.print === 'mould' ? uprightArea(object, outline, MOULD_DRAFT) : 0,
  };
}
