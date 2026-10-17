import { existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { Resvg } from '@resvg/resvg-js';
import { inkStrokes, type Vec } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { StudioError } from './ops.js';
import {
  check,
  loadModel,
  placeFills,
  tutorialColoring,
  tutorialOf,
  type Draft,
} from './player.js';

/**
 * Pictures of a drawing for the agents: the construction with its points
 * named, and the wall of colored pieces. They are drawn here as SVG and
 * turned into PNG without a browser, so they follow the drawing exactly
 * but do not copy the app's look.
 */
export interface Area {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const PAPER = '#fbf8f3';
const GUIDE = '#8f9aa6';
const INK = '#1c2733';
const LABEL = '#17676b';
const TILE = '#b8862a';

const num = (n: number) => Number(n.toFixed(4));

function frame(points: readonly Vec[], area?: Area) {
  if (area) {
    if (!(area.width > 0 && area.height > 0))
      throw new StudioError('An area needs a positive width and height.');
    return { minX: area.x, minY: area.y, w: area.width, h: area.height };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX || 2;
  const h = Math.max(...ys) - minY || 2;
  const m = Math.max(w, h) * 0.08;
  return { minX: minX - m, minY: minY - m, w: w + 2 * m, h: h + 2 * m };
}

/** An SVG in drawing units, y up as in the tutorial frame. */
function svg(box: ReturnType<typeof frame>, body: string, labels = '') {
  const { minX, minY, w, h } = box;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(minX)} ${num(-minY - h)} ${num(w)} ${num(h)}"><rect x="${num(minX)}" y="${num(-minY - h)}" width="${num(w)}" height="${num(h)}" fill="${PAPER}"/><g transform="scale(1,-1)">${body}</g>${labels}</svg>`;
}

/** The construction: guides faint, ink dark, tile outlined, points named. */
export function constructionSvg(draft: Draft, area?: Area): string {
  const { scene } = check(draft);
  const elements = [...scene.elements.values()];
  const points = elements.flatMap((e) =>
    e.geometry.kind === 'point' ? [{ name: e.name, at: e.geometry.at }] : [],
  );
  const extent: Vec[] = points.map((p) => p.at);
  for (const e of elements)
    if (e.geometry.kind === 'circle') {
      const { centre: c, radius: r } = e.geometry.circle;
      extent.push({ x: c.x - r, y: c.y - r }, { x: c.x + r, y: c.y + r });
    }
  const box = frame(
    extent.length
      ? extent
      : [
          { x: -1, y: -1 },
          { x: 1, y: 1 },
        ],
    area,
  );
  const s = Math.max(box.w, box.h) / 600;
  const far = Math.hypot(box.w, box.h) * 4;
  const parts: string[] = [];
  for (const { geometry: g } of elements) {
    if (g.kind === 'circle')
      parts.push(
        `<circle cx="${num(g.circle.centre.x)}" cy="${num(g.circle.centre.y)}" r="${num(g.circle.radius)}" fill="none" stroke="${GUIDE}" stroke-width="${num(s)}"/>`,
      );
    if (g.kind === 'line') {
      const { point: p, dir: d } = g.line;
      parts.push(
        `<line x1="${num(p.x - d.x * far)}" y1="${num(p.y - d.y * far)}" x2="${num(p.x + d.x * far)}" y2="${num(p.y + d.y * far)}" stroke="${GUIDE}" stroke-width="${num(s)}"/>`,
      );
    }
    if (g.kind === 'polygon')
      parts.push(
        `<polygon points="${g.vertices.map((v) => `${num(v.x)},${num(v.y)}`).join(' ')}" fill="none" stroke="${GUIDE}" stroke-width="${num(s * 1.5)}"/>`,
      );
  }
  const cell = draft.pattern?.cell
    ? scene.elements.get(draft.pattern.cell)?.geometry
    : undefined;
  if (cell?.kind === 'polygon')
    parts.push(
      `<polygon points="${cell.vertices.map((v) => `${num(v.x)},${num(v.y)}`).join(' ')}" fill="none" stroke="${TILE}" stroke-width="${num(s * 3)}" stroke-dasharray="${num(s * 10)} ${num(s * 6)}"/>`,
    );
  if (draft.ink?.paths.length) {
    try {
      for (const {
        segment: { a, b },
      } of inkStrokes(scene, draft as Tutorial))
        parts.push(
          `<line x1="${num(a.x)}" y1="${num(a.y)}" x2="${num(b.x)}" y2="${num(b.y)}" stroke="${INK}" stroke-width="${num(s * 4)}" stroke-linecap="round"/>`,
        );
    } catch {
      // Ink that no longer follows the construction is left out; check says why.
    }
  }
  const inside = (p: Vec) =>
    p.x >= box.minX &&
    p.x <= box.minX + box.w &&
    p.y >= box.minY &&
    p.y <= box.minY + box.h;
  const shown = points.filter((p) => inside(p.at));
  // Named points first; crossings of groups (k.1, k.2…) only while few.
  const named = [
    ...shown.filter((p) => !p.name.includes('.')),
    ...shown.filter((p) => p.name.includes('.')),
  ].slice(0, 160);
  for (const p of named)
    parts.push(
      `<circle cx="${num(p.at.x)}" cy="${num(p.at.y)}" r="${num(s * 3)}" fill="${LABEL}"/>`,
    );
  const labels = named
    .map(
      (p) =>
        `<text x="${num(p.at.x + s * 5)}" y="${num(-p.at.y - s * 5)}" font-family="${RENDER_FONT.defaultFontFamily}" font-size="${num(s * 13)}" fill="${LABEL}">${p.name.replace(/[<&]/g, '')}</text>`,
    )
    .join('');
  return svg(box, parts.join(''), labels);
}

/** The repeated wall: copies of the tile around the centre, colored. */
export function wallSvg(draft: Draft, copies = 2, area?: Area): string {
  const made = tutorialOf(draft);
  if ('reason' in made)
    throw new StudioError(`There is no wall yet: ${made.reason}`);
  const model = loadModel(made.tutorial);
  const { cell, pieces, ink } = model.pattern;
  const fill = placeFills(model, tutorialColoring(model));
  const parts: string[] = [];
  const extent: Vec[] = [];
  const n = Math.max(1, Math.min(4, copies));
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      pieces.forEach((p, k) => {
        const poly = p.polygon.map((q) => ({ x: q.x + dx, y: q.y + dy }));
        extent.push(...poly);
        parts.push(
          `<polygon points="${poly.map((q) => `${num(q.x)},${num(q.y)}`).join(' ')}" fill="${fill(k, i, j)}"/>`,
        );
      });
    }
  const box = frame(extent, area);
  const s = Math.max(box.w, box.h) / 600;
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      for (const {
        segment: { a, b },
      } of ink)
        parts.push(
          `<line x1="${num(a.x + dx)}" y1="${num(a.y + dy)}" x2="${num(b.x + dx)}" y2="${num(b.y + dy)}" stroke="${INK}" stroke-width="${num(s * 2.5)}" stroke-linecap="round"/>`,
        );
    }
  parts.push(
    `<polygon points="${cell.corners.map((v) => `${num(v.x)},${num(v.y)}`).join(' ')}" fill="none" stroke="${TILE}" stroke-width="${num(s * 3)}" stroke-dasharray="${num(s * 10)} ${num(s * 6)}"/>`,
  );
  return svg(box, parts.join(''));
}

/**
 * The font for point names: one named file, because scanning every system
 * font hangs inside the test runner. Without one, names are left out.
 */
const FONT = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
].find((file) => existsSync(file));
export const RENDER_FONT = {
  loadSystemFonts: false,
  fontFiles: FONT ? [FONT] : [],
  defaultFontFamily: FONT?.includes('Noto')
    ? 'Noto Sans'
    : FONT?.includes('Liberation')
      ? 'Liberation Sans'
      : FONT?.includes('Arial')
        ? 'Arial'
        : 'DejaVu Sans',
};

/** The picture as PNG, at most `size` pixels on its longer side. */
export function png(svgText: string, size = 768): Buffer {
  const fit = new Resvg(svgText, { font: RENDER_FONT });
  const tall = fit.height > fit.width;
  const image = new Resvg(svgText, {
    fitTo: { mode: tall ? 'height' : 'width', value: size },
    font: RENDER_FONT,
  }).render();
  return indexedPng(image.pixels, image.width, image.height);
}

/**
 * RGBA pixels as a PNG of at most 256 colours. The drawings use a handful
 * of colours and their blends, so this keeps them sharp at a fraction of
 * the size, which matters because a chat app limits how big a tool's
 * answer may be. Colours are grouped coarser until 256 groups are enough,
 * and each group is drawn in its average colour.
 */
export function indexedPng(rgba: Buffer, width: number, height: number) {
  const n = width * height;
  let index = new Uint8Array(n);
  let palette: number[][] = [];
  for (const shift of [2, 3, 4, 5, 6]) {
    const groups = new Map<number, number>();
    const sums: number[][] = [];
    let fits = true;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const key =
        ((rgba[o]! >> shift) << 24) |
        ((rgba[o + 1]! >> shift) << 16) |
        ((rgba[o + 2]! >> shift) << 8) |
        (rgba[o + 3]! >> Math.max(shift, 4));
      let g = groups.get(key);
      if (g === undefined) {
        if (groups.size === 256) {
          fits = false;
          break;
        }
        g = groups.size;
        groups.set(key, g);
        sums.push([0, 0, 0, 0, 0]);
      }
      const sum = sums[g]!;
      for (let c = 0; c < 4; c++) sum[c]! += rgba[o + c]!;
      sum[4]! += 1;
      index[i] = g;
    }
    if (!fits) continue;
    palette = sums.map((s) => s.slice(0, 4).map((v) => Math.round(v / s[4]!)));
    break;
  }
  if (!palette.length) {
    // Never reached with 4 levels per channel and alpha; kept as a guard.
    index = new Uint8Array(n);
    palette = [[0, 0, 0, 255]];
  }
  const rows = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++)
    rows.set(index.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 3, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('PLTE', Buffer.from(palette.flatMap((c) => c.slice(0, 3)))),
    ...(palette.some((c) => c[3]! < 255)
      ? [chunk('tRNS', Buffer.from(palette.map((c) => c[3]!)))]
      : []),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function chunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  let c = 0xffffffff;
  for (const b of head.subarray(4)) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  for (const b of data) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}
