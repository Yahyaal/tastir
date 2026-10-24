import { jaliTextureSvg } from './jaliTexture';
import type { JaliAppearance, PenLook } from '@tastir/schema';
import type { Vec } from '@tastir/engine';
import type { Model } from './model';
import { patchesAt, patchPath } from './interlace';
import { banded, type WallStyle } from './Wall';
import { strapWidths } from './drawing';
import { DEFAULT_FINISH, type Finish } from './coloring';
import { DEFAULT_JALI, jaliLayers, jaliLight, latticeWidth } from './jali';
import { DEFAULT_PEN, DOUBLE, PAPER, penStrokes } from './pen';
import { graphite, texture, washFill } from './drawnTexture';

const f = (n: number) => String(Math.round(n * 1e5) / 1e5);

export interface WallOptions {
  readonly look?: WallStyle;
  readonly grout?: number;
  readonly jali?: JaliAppearance;
  /** How the lines style draws: pen, wash and ink. */
  readonly pen?: PenLook;
  /** The paper under the lines style (white to print). */
  readonly paper?: string;
  /** How many tiles across and down. */
  readonly across?: number;
  readonly down?: number;
  /** Size of one unit (OA) in output pixels. */
  readonly scale?: number;
  readonly title?: string;
  /** The fill for each placement, when same shapes take different colors. */
  readonly fill?: (piece: number, i: number, j: number) => string;
  /** The colours of the lines and bands. */
  readonly finish?: Finish;
}

/**
 * The colored wall as a standalone SVG document: explicit copies of the
 * pieces over `across` × `down` tiles, every color and width written as an
 * attribute, so it opens the same in any program.
 */
export function wallSvg(
  model: Model,
  colors: readonly string[],
  options: WallOptions = {},
): string {
  const {
    look = 'tiles',
    grout = 1,
    jali: appearance = DEFAULT_JALI,
    pen = DEFAULT_PEN,
    paper = PAPER,
    across = 4,
    down = 4,
    scale = 100,
    title = model.tutorial.title,
    fill: placed,
    finish = DEFAULT_FINISH,
  } = options;
  const INK = finish.lines;
  const BAND = finish.band;
  const { cell, pieces, ink } = model.pattern;
  const xs = cell.corners.map((p) => p.x);
  const ys = cell.corners.map((p) => p.y);
  const cellW = Math.max(...xs) - Math.min(...xs);
  const cellH = Math.max(...ys) - Math.min(...ys);
  const centre = {
    x: (Math.max(...xs) + Math.min(...xs)) / 2,
    y: (Math.max(...ys) + Math.min(...ys)) / 2,
  };
  const view = {
    minX: centre.x - (across * cellW) / 2,
    maxX: centre.x + (across * cellW) / 2,
    minY: centre.y - (down * cellH) / 2,
    maxY: centre.y + (down * cellH) / 2,
  };
  const w = view.maxX - view.minX;
  const h = view.maxY - view.minY;
  const jali = look === 'jali';
  const groutWidth = strapWidths(
    model,
    jali ? latticeWidth(grout) : grout,
  ).grout;
  // Every shift of the cell whose pieces may reach into the view.
  const shifts: (Vec & { i: number; j: number })[] = [];
  const reach = Math.ceil(Math.max(across, down) / 2) + 2;
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      shifts.push({
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
        i,
        j,
      });
    }
  }
  const pt = (p: Vec, d: Vec) => `${f(p.x + d.x)},${f(-(p.y + d.y))}`;
  const inView = (ps: readonly Vec[], d: Vec) =>
    ps.some(
      (p) =>
        p.x + d.x > view.minX - cellW &&
        p.x + d.x < view.maxX + cellW &&
        p.y + d.y > view.minY - cellH &&
        p.y + d.y < view.maxY + cellH,
    );
  const body: string[] = [];
  if (jali)
    body.push(
      `<rect class="jali-ground" x="${f(view.minX)}" y="${f(-view.maxY)}" width="${f(w)}" height="${f(h)}" fill="url(#jali-light)"/>`,
    );
  const lines = look === 'lines';
  if (lines)
    body.push(
      `<rect x="${f(view.minX)}" y="${f(-view.maxY)}" width="${f(w)}" height="${f(h)}" fill="${paper}"/>`,
    );
  // The lines style's wash goes through a paint or pencil texture, turned
  // for pencil so its streaks slant like shading.
  const washed = lines && pen.wash;
  const tex = texture(pen.pen, groutWidth, 'wash');
  const { opacity: washAlpha, edge: washEdge } = washFill(pen.pen);
  if (washed)
    body.push(
      `<g transform="rotate(${tex.turn})" filter="url(#wash)"><g transform="rotate(${-tex.turn})">`,
    );
  for (const d of jali ? [] : shifts) {
    for (const [k, p] of pieces.entries()) {
      if (!inView(p.polygon, d)) continue;
      const fill =
        lines && !pen.wash
          ? 'none'
          : placed
            ? placed(k, d.i, d.j)
            : (colors[p.type] ?? '#999999');
      // Paint pools darker at the edge of each piece.
      const stroke = lines
        ? washed && washEdge
          ? fill
          : 'none'
        : banded(look)
          ? 'none'
          : INK;
      const width = lines ? groutWidth * 1.6 : groutWidth;
      const wash = washed
        ? ` fill-opacity="${washAlpha}" stroke-opacity="${washEdge}"`
        : '';
      body.push(
        `<polygon data-type="${p.type}" points="${p.polygon.map((q) => pt(q, d)).join(' ')}" fill="${fill}"${wash} stroke="${stroke}" stroke-width="${f(width)}" stroke-linejoin="round"/>`,
      );
    }
  }
  if (washed) body.push('</g></g>');
  // The pen along the ink; the double pen's band casts a shadow and is
  // woven over and under, as interlace is.
  if (lines) {
    const path = shifts
      .flatMap((d) =>
        ink.flatMap((s) =>
          inView([s.segment.a, s.segment.b], d)
            ? [
                `M${pt(s.segment.a, d).replace(',', ' ')}L${pt(s.segment.b, d).replace(',', ' ')}`,
              ]
            : [],
        ),
      )
      .join('');
    const double = pen.pen === 'double';
    if (double)
      body.push(
        `<path d="${path}" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="${f(groutWidth * DOUBLE.edge)}" stroke-linecap="round" transform="translate(${f(groutWidth * 0.7)} ${f(groutWidth * 0.9)})" filter="url(#soft)"/>`,
      );
    for (const s of penStrokes(pen.pen))
      body.push(
        `<path d="${path}" fill="none" stroke="${s.paper ? paper : pen.ink}" stroke-opacity="${s.opacity}" stroke-width="${f(groutWidth * s.width)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f(groutWidth * s.dx)} ${f(groutWidth * s.dy)})"${pen.pen === 'pencil' && !s.paper ? ' filter="url(#graphite)"' : ''}/>`,
      );
    if (double) {
      const zero = { x: 0, y: 0 };
      const place = (q: Vec) => pt(q, zero).replace(',', ' ');
      const edges: string[] = [];
      const bands: string[] = [];
      for (const d of shifts)
        for (const p of patchesAt(
          model.pattern,
          d.i,
          d.j,
          groutWidth * DOUBLE.edge,
        )) {
          if (!inView(p.band, zero)) continue;
          edges.push(patchPath(p.edge, place));
          bands.push(patchPath(p.band, place));
        }
      body.push(
        `<path d="${edges.join('')}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="${f(groutWidth * (DOUBLE.edge + 1.6))}" stroke-linecap="butt" filter="url(#soft)"/>`,
        `<path d="${edges.join('')}" fill="none" stroke="${pen.ink}" stroke-width="${f(groutWidth * DOUBLE.edge)}" stroke-linecap="butt" stroke-linejoin="round"/>`,
        `<path d="${bands.join('')}" fill="none" stroke="${paper}" stroke-width="${f(groutWidth * DOUBLE.band)}" stroke-linecap="butt" stroke-linejoin="round"/>`,
      );
    }
  }
  if (jali) {
    const path = shifts
      .flatMap((d) =>
        ink.flatMap((s) =>
          inView([s.segment.a, s.segment.b], d)
            ? [
                `M${pt(s.segment.a, d).replace(',', ' ')}L${pt(s.segment.b, d).replace(',', ' ')}`,
              ]
            : [],
        ),
      )
      .join('');
    body.push(
      `<g class="jali-framework" data-material="${appearance.material}" data-finish="${appearance.finish}" fill="none">`,
    );
    body.push(
      `<defs>${jaliTextureSvg('jali-texture', appearance, groutWidth)}</defs>`,
    );
    for (const layer of jaliLayers(appearance)) {
      body.push(
        `<path data-layer="${layer.name}" d="${path}" stroke="${layer.color}" stroke-width="${f(layer.width * groutWidth)}" stroke-linecap="round" stroke-linejoin="round"${layer.dash ? ` stroke-dasharray="${layer.dash.map((n) => f(n * groutWidth)).join(' ')}"` : ''} transform="translate(${f(layer.x * groutWidth)} ${f(layer.y * groutWidth)})"/>`,
      );
    }
    body.push(
      `<path data-layer="texture" d="${path}" stroke="url(#jali-texture)" stroke-width="${f(5.1 * groutWidth)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f(0.24 * groutWidth)} ${f(0.24 * groutWidth)})"/>`,
    );
    body.push('</g>');
  }
  if (banded(look)) {
    const line = (
      a: Vec,
      b: Vec,
      d: Vec,
      color: string,
      k: number,
      cap: string,
    ) => {
      const [x1, y1] = pt(a, d).split(',');
      const [x2, y2] = pt(b, d).split(',');
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${f(groutWidth * k)}" stroke-linecap="${cap}"/>`;
    };
    for (const [color, k] of [
      [INK, 4],
      [BAND, 2.4],
    ] as const) {
      for (const d of shifts) {
        for (const s of ink) {
          if (!inView([s.segment.a, s.segment.b], d)) continue;
          body.push(line(s.segment.a, s.segment.b, d, color, k, 'round'));
        }
      }
    }
    // Interlace: the band on top at each crossing, drawn again.
    if (look === 'interlace')
      for (const d of shifts) {
        const zero = { x: 0, y: 0 };
        for (const p of patchesAt(model.pattern, d.i, d.j, groutWidth * 4)) {
          if (!inView(p.band, zero)) continue;
          for (const [ps, color, k] of [
            [p.edge, INK, 4],
            [p.band, BAND, 2.4],
          ] as const)
            body.push(
              `<path d="${patchPath(ps, (q) => pt(q, zero).replace(',', ' '))}" fill="none" stroke="${color}" stroke-width="${f(groutWidth * k)}" stroke-linecap="butt" stroke-linejoin="round"/>`,
            );
        }
      }
  }
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" viewBox="${f(view.minX)} ${f(-view.maxY)} ${f(w)} ${f(h)}">`,
    `<title>${esc(title)}</title>`,
    ...(lines
      ? [
          `<defs>${tex.markup}${graphite(groutWidth, 'graphite')}<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${f(groutWidth * 0.35)}"/></filter></defs>`,
        ]
      : []),
    ...(jali
      ? [
          `<defs><linearGradient id="jali-light" x1="0" y1="0" x2="0.8" y2="1">${jaliLight(
            appearance.background,
          )
            .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`)
            .join('')}</linearGradient></defs>`,
        ]
      : []),
    `<clipPath id="wall"><rect x="${f(view.minX)}" y="${f(-view.maxY)}" width="${f(w)}" height="${f(h)}"/></clipPath>`,
    `<g clip-path="url(#wall)">`,
    ...body,
    `</g>`,
    `</svg>`,
  ].join('\n');
}

/** Saves a blob under a file name, as a download. */
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const svgBlob = (svg: string) =>
  new Blob([svg], { type: 'image/svg+xml' });

/** The SVG drawn onto a canvas and saved as PNG. */
export async function pngBlob(svg: string): Promise<Blob> {
  const url = URL.createObjectURL(svgBlob(svg));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error('The PNG could not be made')),
        'image/png',
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
