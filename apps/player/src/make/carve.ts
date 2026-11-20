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
  flatLines,
  type Cuts,
  type FlatLines,
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
  layoutSvg,
  MAGNETS,
  numbering,
  placed,
  plates as packPlates,
  tilePieces,
  tray,
  TRAY,
  type Magnet,
} from '@tastir/relief';
import { colourName } from '../app/colourNames';

/** What is printed: the object itself (to keep, or as a master), a rigid
 * mould to cast plaster in, a box to pour silicone round the master, or
 * every piece on its own, to lay side by side like zellige. */
export type Print = 'object' | 'mould' | 'box' | 'pieces';

/** The magnet set into each piece, or none. */
export type MagnetChoice = keyof typeof MAGNETS | 'none';

/** What the tile pieces need beyond the panel. */
export interface PiecesRequest {
  readonly thickness: number;
  readonly joint: number;
  readonly bevel: number;
  readonly magnet: MagnetChoice;
  readonly tray: boolean;
  /** Whole pieces, none cut and no frame: those whose middle is inside
   * the outline, or those of these copies of the tile. */
  readonly whole?: boolean;
  readonly cells?: readonly { readonly i: number; readonly j: number }[];
  /** Each piece's colour as the wall shows it: `fill[(k * m + i) * n + j]`
   * for the k-th piece of the tile, copied i (mod m) times along u and j
   * (mod n) times along v. */
  readonly colours: { readonly repeat: readonly [number, number]; readonly fill: readonly string[] };
  readonly frameColour: string;
  /** Each piece type's name, for the files. */
  readonly names: readonly string[];
  /** Cuts for the tray, when it is larger than the bed. */
  readonly trayCuts: Cuts;
}

/** One kind of piece in one colour, and how many. */
export interface PieceCount {
  readonly colour: string;
  /** The engine's piece type, or -1 for the frame. */
  readonly type: number;
  readonly whole: number;
  readonly cut: number;
}

/** A plate of pieces in one colour, each piece its own named object. */
export interface PiecePlate {
  readonly colour: string;
  readonly name: string;
  readonly items: readonly { readonly name: string; readonly mesh: Mesh }[];
  readonly volume: number;
}

export interface PiecesResult {
  /** The pieces in their places, one mesh to a colour, for the view. */
  readonly colours: readonly { readonly colour: string; readonly mesh: Mesh }[];
  readonly plates: readonly PiecePlate[];
  readonly counts: readonly PieceCount[];
  /** Magnets by size (6x2…), and pieces with none. */
  readonly magnets: Readonly<Record<string, number>>;
  readonly without: number;
  readonly pieces: number;
  readonly smallest: number;
  readonly dropped: number;
  /** The full-size layout to print on paper. */
  readonly layout: string;
  /** The tray, in parts when it is cut. */
  readonly tray?: readonly Part3D[];
}

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
  /** The tile pieces, when they are printed. */
  readonly pieces?: PiecesRequest;
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
  /** How many pins join the parts: none when the solid is too thin, or
   * pierced, where a pin could open into a hole. */
  readonly pins?: number;
  readonly pinless?: 'thin' | 'pierced';
  /** The object's lines, flat, for a laser or a router. */
  readonly lines: FlatLines;
  readonly set?: PiecesResult;
}

export function carve(r: CarveRequest): Carving3D {
  if (r.print === 'pieces' && r.pieces) return carvePieces(r, r.pieces);
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
  const { surface, outline, tagged } = reliefSurface(r.pattern, options);
  const pierced = Object.values(r.carvings).some((c) => c.kind === 'pierced');
  let pinless: 'thin' | 'pierced' | undefined;
  const top = topOf({ surface, outline, frame: r.frame, top: r.thickness });
  const object = standOn(top, outline);
  const split = r.print !== 'box' && (r.cuts.xs.length > 0 || r.cuts.ys.length > 0);
  let parts: MeshPart[] | undefined;
  let pins = 0;
  if (split && r.print === 'mould') {
    const floor = Math.max(r.floor, SPLIT_FLOOR);
    const at = pierced ? [] : pinsFor(mouldOutline(outline, r.wall), r.cuts, floor / 2);
    if (pierced) pinless = 'pierced';
    parts = mouldParts(top, outline, r.thickness, { floor, wall: r.wall }, r.cuts, at);
    pins = at.length;
  } else if (split) {
    const deepest = Math.max(...Object.values(r.carvings).map(depthOf));
    const room = r.thickness - deepest;
    const at = !pierced && room >= PIN_ROOM ? pinsFor(outline, r.cuts, room / 2) : [];
    if (!at.length) pinless = pierced ? 'pierced' : 'thin';
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
    ...(apart ? { parts: apart, pins, ...(pinless ? { pinless } : {}) } : {}),
    lines: flatLines(surface, tagged, outline, r.frame, r.thickness),
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

const magnetName = (m: Magnet) =>
  (Object.entries(MAGNETS).find(([, v]) => v === m)?.[0] ?? `${m.across}x${m.thick}`) as string;

/** Every piece on its own, packed onto one-colour plates. */
function carvePieces(r: CarveRequest, p: PiecesRequest): Carving3D {
  const [m, n] = p.colours.repeat;
  const mod = (a: number, b: number) => ((a % b) + b) % b;
  const set = tilePieces(r.pattern, {
    outline: r.outline,
    scale: r.scale,
    frame: r.frame,
    thickness: p.thickness,
    joint: p.joint,
    bevel: p.bevel,
    ...(p.magnet === 'none' ? {} : { magnet: MAGNETS[p.magnet] }),
    colour: (k, i, j) => p.colours.fill[(k * m + mod(i, m)) * n + mod(j, n)] ?? '#999999',
    frameColour: p.frameColour,
    ...(p.whole ? { whole: true, ...(p.cells ? { cells: p.cells } : {}) } : {}),
  });
  if (!set.pieces.length) throw new Error('No piece is left inside the outline.');
  for (const piece of set.pieces) {
    const open = openEdges(piece.mesh);
    if (open) throw new Error(`A piece has ${open} open edges.`);
  }
  // Colour names for files: the same name twice gets a number.
  const names = new Map<string, string>();
  for (const piece of set.pieces) {
    if (names.has(piece.colour)) continue;
    const base = colourName(piece.colour);
    let name = base;
    for (let k = 2; [...names.values()].includes(name); k++) name = `${base} ${k}`;
    names.set(piece.colour, name);
  }
  const number = numbering(set.pieces);
  const kindName = (type: number) => (type < 0 ? 'frame strip' : (p.names[type] ?? 'piece'));
  const packed = packPlates(set.pieces);
  const perColour = new Map<string, number>();
  for (const plate of packed) perColour.set(plate.colour, (perColour.get(plate.colour) ?? 0) + 1);
  const seen = new Map<string, number>();
  const plates: PiecePlate[] = packed.map((plate) => {
    const k = (seen.get(plate.colour) ?? 0) + 1;
    seen.set(plate.colour, k);
    const colour = names.get(plate.colour)!;
    const items = plate.items.map((item) => {
      const piece = set.pieces[item.piece]!;
      return {
        name: `${colour} ${kindName(piece.type)} ${number[item.piece]}`,
        mesh: placed(piece.mesh, item.angle, item.shift),
      };
    });
    return {
      colour: plate.colour,
      name: `${colour}, plate ${k} of ${perColour.get(plate.colour)}`,
      items,
      volume: items.reduce((v, i) => v + volumeOf(i.mesh), 0),
    };
  });
  const counts = new Map<string, { colour: string; type: number; whole: number; cut: number }>();
  const magnets: Record<string, number> = {};
  let without = 0;
  for (const piece of set.pieces) {
    const key = `${piece.colour}|${piece.type}`;
    const c = counts.get(key) ?? { colour: piece.colour, type: piece.type, whole: 0, cut: 0 };
    if (piece.cut) c.cut++;
    else c.whole++;
    counts.set(key, c);
    if (piece.magnet) magnets[magnetName(piece.magnet)] = (magnets[magnetName(piece.magnet)] ?? 0) + 1;
    else if (p.magnet !== 'none') without++;
  }
  // In the view the pieces stand in the tray, on its floor.
  const withTray = p.tray && !p.whole;
  const lift = withTray ? TRAY.floor : 0;
  const byColour = new Map<string, Mesh[]>();
  for (const piece of set.pieces)
    byColour.set(piece.colour, [...(byColour.get(piece.colour) ?? []), raised(piece.mesh, lift)]);
  const colours = [...byColour].map(([colour, meshes]) => ({ colour, mesh: joinMeshes(meshes) }));
  const trayParts = withTray ? spread(tray(r.outline, p.joint, p.trayCuts), p.trayCuts) : undefined;
  for (const part of trayParts ?? []) {
    const open = openEdges(part.mesh);
    if (open) throw new Error(`The tray has ${open} open edges.`);
  }
  const mesh = joinMeshes(colours.map((c) => c.mesh));
  const volume = plates.reduce((v, plate) => v + plate.volume, 0);
  return {
    mesh,
    ...(trayParts ? { master: joinMeshes(trayParts.map((t) => t.mesh)) } : {}),
    volume,
    cast: volume,
    upright: 0,
    lines: { cut: set.pieces.map((piece) => piece.outline), engrave: [] },
    set: {
      colours,
      plates,
      counts: [...counts.values()],
      magnets,
      without,
      pieces: set.pieces.length,
      smallest: set.smallest,
      dropped: set.dropped,
      layout: layoutSvg(set.pieces, p.whole ? [] : r.outline),
      ...(trayParts ? { tray: trayParts } : {}),
    },
  };
}

/** A mesh moved up. */
function raised(mesh: Mesh, dz: number): Mesh {
  if (!dz) return mesh;
  return {
    positions: Float64Array.from(mesh.positions, (v, i) => (i % 3 === 2 ? v + dz : v)),
    triangles: mesh.triangles,
  };
}
