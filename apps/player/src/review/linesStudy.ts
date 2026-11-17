import type { Vec } from '@tastir/engine';
import { PALETTES, slotOf, type Palette } from '../app/coloring';
import type { Model } from '../app/model';
import { hash, inset, shade, watercolour } from '../app/drawnTexture';

export { hash, inset, shade };

/**
 * The lines study (STYLE.1): three hand-made looks drawn as a finished
 * sheet on paper rather than an endless wall. Review only; the player's
 * own lines style is unchanged.
 *
 * Every piece is painted on its own, so a wash never runs from one piece
 * into the next (the old wall-wide texture did, and read as camouflage).
 */
export type Look = 'watercolour' | 'ink-wash' | 'pencil';

export const LOOKS: readonly {
  readonly look: Look;
  readonly name: string;
  readonly note: string;
}[] = [
  {
    look: 'watercolour',
    name: 'Watercolour',
    note: 'Each piece painted on its own, darker where the paint pooled at its edge. No ink: the pattern is the paper left between the pieces.',
  },
  {
    look: 'ink-wash',
    name: 'Ink and wash',
    note: 'The same painting with a fine hand-drawn ink line over it, the way an illuminated page is finished.',
  },
  {
    look: 'pencil',
    name: 'Coloured pencil',
    note: 'Pencil shading in each piece, each at its own slant, a graphite outline, and the compass and ruler construction left showing.',
  },
];

/** Palettes made for paper, now presets in the player. */
export const PAPER_PALETTES: Readonly<Record<string, Palette>> =
  Object.fromEntries(
    ['Rose', 'Violet and sky', 'Indigo and ochre', 'Teal and gold'].flatMap(
      (name) => {
        const p = PALETTES[name];
        return p ? [[name, p]] : [];
      },
    ),
  );

/** The palette each look opens with. */
export const LOOK_PALETTE: Readonly<Record<Look, string>> = {
  watercolour: 'Rose',
  'ink-wash': 'Indigo and ochre',
  pencil: 'Violet and sky',
};

export { PAPER } from '../app/pen';
export const INK = '#2a2420';
export const GRAPHITE = '#4a4744';

export interface Rect {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface SheetPiece {
  readonly key: string;
  readonly polygon: readonly Vec[];
  readonly centre: Vec;
  readonly color: string;
  /** In [0, 1): this piece's own variation, the same on every render. */
  readonly seed: number;
}

const centroid = (ps: readonly Vec[]) => ({
  x: ps.reduce((s, p) => s + p.x, 0) / ps.length,
  y: ps.reduce((s, p) => s + p.y, 0) / ps.length,
});

/**
 * The sheet: about `cells` repeats across, a little wider than tall,
 * centred on the middle of the first cell. Pieces whose centre falls in
 * it are drawn whole, so the edge of the sheet follows the pattern.
 */
export function sheetOf(model: Model, palette: Palette) {
  const { cell, pieces } = model.pattern;
  // Enough repeats to read the pattern: about 120 pieces on the sheet.
  const cells = Math.min(7, Math.max(2.4, Math.sqrt(120 / pieces.length)));
  const span = Math.max(
    Math.hypot(cell.u.x, cell.u.y),
    Math.hypot(cell.v.x, cell.v.y),
  );
  const mid = centroid(cell.corners);
  const w = span * cells;
  const h = w * 0.66;
  const area: Rect = {
    minX: mid.x - w / 2,
    maxX: mid.x + w / 2,
    minY: mid.y - h / 2,
    maxY: mid.y + h / 2,
  };
  const colours = model.pattern.types.map(
    (t, i) => palette[slotOf(model, t, i)],
  );
  const reach = Math.ceil(cells) + 2;
  const out: SheetPiece[] = [];
  const shifts: Vec[] = [];
  for (let i = -reach; i <= reach; i++)
    for (let j = -reach; j <= reach; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      shifts.push({ x: dx, y: dy });
      pieces.forEach((piece, k) => {
        const polygon = piece.polygon.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
        const c = centroid(polygon);
        if (
          c.x < area.minX ||
          c.x > area.maxX ||
          c.y < area.minY ||
          c.y > area.maxY
        )
          return;
        out.push({
          key: `${k}:${i}:${j}`,
          polygon,
          centre: c,
          color: colours[piece.type] ?? palette.a,
          seed: hash(k, i, j),
        });
      });
    }
  return { pieces: out, area, shifts };
}

/** The ink's sides that border a drawn piece: the outline of the sheet. */
export function outlineOf(pieces: readonly SheetPiece[]): [Vec, Vec][] {
  const seen = new Map<string, [Vec, Vec]>();
  const k = (p: Vec) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
  for (const { polygon } of pieces)
    polygon.forEach((a, i) => {
      const b = polygon[(i + 1) % polygon.length] ?? a;
      const key = [k(a), k(b)].sort().join('|');
      if (!seen.has(key)) seen.set(key, [a, b]);
    });
  return [...seen.values()];
}

/** Where a line crosses a rectangle, if it does. */
function clipLine(p: Vec, d: Vec, r: Rect): [Vec, Vec] | undefined {
  let lo = -Infinity;
  let hi = Infinity;
  for (const [o, v, min, max] of [
    [p.x, d.x, r.minX, r.maxX],
    [p.y, d.y, r.minY, r.maxY],
  ] as const) {
    if (Math.abs(v) < 1e-12) {
      if (o < min || o > max) return undefined;
      continue;
    }
    const a = (min - o) / v;
    const b = (max - o) / v;
    lo = Math.max(lo, Math.min(a, b));
    hi = Math.min(hi, Math.max(a, b));
  }
  if (lo >= hi) return undefined;
  return [
    { x: p.x + d.x * lo, y: p.y + d.y * lo },
    { x: p.x + d.x * hi, y: p.y + d.y * hi },
  ];
}

/**
 * The construction left on the sheet: every circle and line of the
 * tutorial, copied to each repeat near the sheet and clipped a little
 * beyond it, with the copies that land on each other drawn once.
 */
export function constructionOf(
  model: Model,
  shifts: readonly Vec[],
  area: Rect,
) {
  const span = area.maxX - area.minX;
  const bounds: Rect = {
    minX: area.minX - span * 0.06,
    maxX: area.maxX + span * 0.06,
    minY: area.minY - span * 0.06,
    maxY: area.maxY + span * 0.06,
  };
  const lines = new Map<string, [Vec, Vec]>();
  const circles = new Map<string, { c: Vec; r: number }>();
  const near = (c: Vec, r: number) =>
    c.x + r > bounds.minX &&
    c.x - r < bounds.maxX &&
    c.y + r > bounds.minY &&
    c.y - r < bounds.maxY;
  for (const el of model.scene.elements.values()) {
    if (model.hide?.has(el.name)) continue;
    const g = el.geometry;
    for (const s of shifts) {
      if (g.kind === 'circle') {
        const c = { x: g.circle.centre.x + s.x, y: g.circle.centre.y + s.y };
        if (!near(c, g.circle.radius)) continue;
        circles.set(
          `${c.x.toFixed(3)},${c.y.toFixed(3)},${g.circle.radius.toFixed(3)}`,
          { c, r: g.circle.radius },
        );
      } else if (g.kind === 'line') {
        const p = { x: g.line.point.x + s.x, y: g.line.point.y + s.y };
        const d = g.line.dir;
        const len = Math.hypot(d.x, d.y) || 1;
        let ux = d.x / len;
        let uy = d.y / len;
        if (ux < -1e-9 || (Math.abs(ux) < 1e-9 && uy < 0)) {
          ux = -ux;
          uy = -uy;
        }
        // The same line from another repeat: same direction and offset.
        const key = `${ux.toFixed(3)},${uy.toFixed(3)},${(p.x * uy - p.y * ux).toFixed(3)}`;
        if (lines.has(key)) continue;
        const seg = clipLine(p, { x: ux, y: uy }, bounds);
        if (seg) lines.set(key, seg);
      }
    }
  }
  return { lines: [...lines.values()], circles: [...circles.values()], bounds };
}

const f = (n: number) => String(Math.round(n * 1e4) / 1e4);
const alpha = (a: number, b: number) =>
  `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${f(a)} 0 0 0 ${f(b)}`;

/**
 * The filters, as SVG markup, sized by the grout width `g` so every
 * pattern gets the same grain. Each is applied to one piece at a time.
 */
export function filters(id: string, g: number): string {
  return [
    // Watercolour: the player's own paint.
    watercolour(g, `${id}-paint`),
    // A pen line drawn by hand: it wavers a little along its length.
    `<filter id="${id}-pen" x="-5%" y="-5%" width="110%" height="110%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (9 * g))}" numOctaves="2" seed="13" result="wob"/>`,
    `<feDisplacementMap in="SourceGraphic" in2="wob" scale="${f(0.7 * g)}" xChannelSelector="R" yChannelSelector="G"/>`,
    `</filter>`,
    // Coloured pencil: strokes of shading along the piece's own slant,
    // and the paper's tooth showing where the pencil skipped.
    `<filter id="${id}-pencil" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (14 * g))} ${f(1 / (0.32 * g))}" numOctaves="2" seed="4" result="streak"/>`,
    `<feColorMatrix in="streak" type="matrix" values="${alpha(2.4, -0.25)}" result="streakA"/>`,
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.4 * g))}" numOctaves="1" seed="9" result="tooth"/>`,
    `<feColorMatrix in="tooth" type="matrix" values="${alpha(2.2, -0.05)}" result="toothA"/>`,
    `<feComposite in="streakA" in2="toothA" operator="arithmetic" k1="1" result="mask"/>`,
    `<feComposite in="SourceGraphic" in2="mask" operator="in"/>`,
    `</filter>`,
    // Graphite: a line that catches on the paper's tooth.
    `<filter id="${id}-graphite" x="-5%" y="-5%" width="110%" height="110%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.35 * g))}" numOctaves="2" seed="11" result="tooth"/>`,
    `<feColorMatrix in="tooth" type="matrix" values="${alpha(2.6, -0.3)}" result="toothA"/>`,
    `<feComposite in="SourceGraphic" in2="toothA" operator="in"/>`,
    `</filter>`,
    // The paper itself: a faint, even grain.
    `<filter id="${id}-paper" x="0" y="0" width="100%" height="100%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.9 * g))}" numOctaves="2" seed="21" result="n"/>`,
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0.22 0 0 0 -0.06"/>`,
    `</filter>`,
  ].join('');
}
