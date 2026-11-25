/**
 * How a piece is carved: its height as a function of the distance from
 * its edge (the ink's centre line). The first half band stays at the top,
 * which is the raised strapwork; after it the surface falls as chosen.
 * Angles are in degrees and lengths in millimetres.
 */
export type Carving =
  /** Left at the top: the piece and its bands make one flat surface. */
  | { readonly kind: 'raised' }
  /** Cut straight through the panel inside its band: a screen's holes. */
  | { readonly kind: 'pierced' }
  /** A flat-bottomed recess; its walls lean out by `draft` from upright
   * so a mould lets go. */
  | { readonly kind: 'flat'; readonly depth: number; readonly draft: number }
  /** Cut as straight slopes from the band down to the ridges of the
   * piece's skeleton, as a carver cuts plaster or wood; `slope` is the
   * slope from level, and a recess deeper than `depth` is cut flat. */
  | { readonly kind: 'facets'; readonly slope: number; readonly depth: number }
  /** A recess whose floor swells back up in a rounded cushion, reaching
   * `rise` above the floor at the piece's middle. */
  | {
      readonly kind: 'cushion';
      readonly depth: number;
      readonly draft: number;
      readonly rise: number;
    };

/** The bands' cross-section: flat, a low round, or two raised lines with
 * a groove along the ink between them. */
export type BandShape = 'flat' | 'rounded' | 'double';

/** The band's half from its middle (the ink) to its edge, as (distance,
 * height below the top) points after the middle. */
function bandPoints(shape: BandShape, band: number): [number, number][] {
  const h = band / 2;
  if (shape === 'rounded') {
    // An arc through the middle at the top and the edge a quarter of the
    // band's width lower.
    const drop = band / 4;
    const r = (h * h + drop * drop) / (2 * drop);
    return Array.from({ length: BAND_CURVE }, (_, i) => {
      const d = (h * (i + 1)) / BAND_CURVE;
      return [d, r - Math.sqrt(r * r - d * d)];
    });
  }
  if (shape === 'double') {
    const groove = band / 6;
    const deep = grooveDepth(band);
    return [
      [groove * 0.35, deep],
      [groove, 0],
      [h, 0],
    ];
  }
  return [[h, 0]];
}

/** How many straight pieces make a rounded band's half. */
const BAND_CURVE = 6;

/** The groove of a double band: 1 mm deep, or less in narrow bands. */
export const grooveDepth = (band: number) => Math.min(1, band / 3);

/** How far below the top a band's edge is. */
export function bandEdge(shape: BandShape, band: number): number {
  return shape === 'rounded' ? band / 4 : 0;
}

export interface Profile {
  /** The distances where the height bends; straight between them. */
  readonly stops: readonly number[];
  /** Where the carving reaches its floor (Infinity: no floor). */
  readonly end: number;
  /** The height at a distance from the edge. */
  readonly z: (d: number) => number;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Straight between the given (distance, height) points, level after. */
function polyline(points: readonly (readonly [number, number])[]) {
  return (d: number) => {
    if (d <= points[0]![0]) return points[0]![1];
    for (let i = 1; i < points.length; i++) {
      const [d1, z1] = points[i]!;
      if (d <= d1) {
        const [d0, z0] = points[i - 1]!;
        return d1 === d0 ? z1 : z0 + ((z1 - z0) * (d - d0)) / (d1 - d0);
      }
    }
    return points[points.length - 1]![1];
  };
}

/** How many straight pieces make a cushion's curve. */
const CURVE = 16;

/**
 * The profile of a carving under a top at `top`, with bands `band` wide.
 * `height` is how far the piece's wavefront goes before it closes (its
 * skeleton's height), which a cushion needs to find its middle.
 */
export function profileOf(
  carving: Carving,
  top: number,
  band: number,
  height: number,
  shape: BandShape = 'flat',
): Profile {
  const h = band / 2;
  // The band first: from the ink out to its edge.
  const lead: [number, number][] = [
    [0, top - (shape === 'double' ? grooveDepth(band) : 0)],
    ...bandPoints(carving.kind === 'raised' ? 'flat' : shape, band).map(
      ([d, below]): [number, number] => [d, top - below],
    ),
  ];
  const edge = lead[lead.length - 1]![1];
  const leadStops = lead.slice(1).map((p) => p[0]);
  const make = (rest: [number, number][], end: number): Profile => {
    const points = [...lead, ...rest];
    return {
      stops: [...leadStops, ...rest.map((p) => p[0])],
      end,
      z: polyline(points),
    };
  };
  switch (carving.kind) {
    case 'raised':
    case 'pierced':
      // The band's strip is kept apart from the rest, which stays level
      // or is cut away.
      return make([], h);
    case 'flat': {
      const wall = h + carving.depth * Math.tan(rad(carving.draft));
      return make([[wall, top - carving.depth]], wall);
    }
    case 'facets': {
      const run = (carving.depth - (top - edge)) / Math.tan(rad(carving.slope));
      return make([[h + run, top - carving.depth]], h + run);
    }
    case 'cushion': {
      const wall = h + carving.depth * Math.tan(rad(carving.draft));
      const floor = top - carving.depth;
      const points: [number, number][] = [[wall, floor]];
      // A quarter ellipse from the foot of the wall to the middle.
      if (height > wall)
        for (let i = 1; i <= CURVE; i++) {
          const s = i / CURVE;
          const a = (s * Math.PI) / 2;
          points.push([
            wall + (height - wall) * (1 - Math.cos(a)),
            floor + carving.rise * Math.sin(a),
          ]);
        }
      return make(points, Infinity);
    }
  }
}

/** How deep a carving goes below the top. */
export function depthOf(carving: Carving): number {
  return carving.kind === 'raised' || carving.kind === 'pierced'
    ? 0
    : carving.depth;
}
