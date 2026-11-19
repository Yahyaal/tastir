import { clip, convexParts, inset, joined, topOf } from './mesh.js';
import { signedArea, type P2, type P3 } from './skeleton.js';
import type { TaggedFace } from './weave.js';

/**
 * The carving as flat lines in millimetres, for a laser cutter, a CNC
 * router or a stencil: `cut` is the outline and every hole through it,
 * and `engrave` the edge of every carved piece, where its band ends. Each
 * is a list of closed loops, the outer ones counter-clockwise.
 */
export interface FlatLines {
  readonly cut: P2[][];
  readonly engrave: P2[][];
}

/** The lines of a carved surface (from `reliefSurface`), over its outline
 * and inside its frame. They come from the same faces the solid is made
 * of, so the files and the print agree. */
export function flatLines(
  surface: readonly (readonly P3[])[],
  tagged: readonly TaggedFace[],
  outline: readonly P2[],
  frame: number,
  thickness: number,
): FlatLines {
  const top = topOf({ surface, outline, frame, top: thickness });
  const solid = top.filter(
    (f) => Math.abs(signedArea(f)) > 1e-12 && !f.every((p) => Math.abs(p.z) < 1e-9),
  );
  const inner = frame > 0 ? inset(outline, frame) : outline.slice();
  const carved: P3[][] = [];
  for (const { face, tag } of tagged)
    if (tag === 'field')
      for (const part of convexParts(face)) {
        const cut = clip(part, inner);
        if (cut.length >= 3 && Math.abs(signedArea(cut)) > 1e-12) carved.push(cut);
      }
  return { cut: boundary(solid), engrave: boundary(carved) };
}

/** The edges of the area some faces cover, seen from above, as loops. */
export function boundary(faces: readonly (readonly P3[])[]): P2[][] {
  const flat = faces.map((f) => f.map((p) => ({ x: p.x, y: p.y, z: 0 })));
  const { points, faces: list, seen } = joined(flat);
  const next = new Map<number, number[]>();
  for (const f of list)
    for (let i = 0; i < f.length; i++) {
      const a = f[i]!;
      const b = f[(i + 1) % f.length]!;
      if (a === b || seen.has(`${b},${a}`)) continue;
      const out = next.get(a);
      if (out) out.push(b);
      else next.set(a, [b]);
    }
  const loops: P2[][] = [];
  for (const start of [...next.keys()]) {
    while (next.get(start)?.length) {
      const loop: number[] = [start];
      let at = next.get(start)!.pop()!;
      let guard = 0;
      while (at !== start && guard++ < 1e6) {
        loop.push(at);
        const out = next.get(at);
        if (!out?.length) break;
        at = out.pop()!;
      }
      if (at === start && loop.length >= 3) loops.push(straightened(loop.map((n) => points[n]!)));
    }
  }
  return loops.filter((l) => l.length >= 3 && Math.abs(signedArea(l)) > 1e-9);
}

/** A loop without the corners that lie on a straight side. */
function straightened(loop: readonly P2[]): P2[] {
  const out = loop.map((p) => ({ x: p.x, y: p.y }));
  let changed = true;
  while (changed && out.length > 3) {
    changed = false;
    for (let i = 0; i < out.length && out.length > 3; i++) {
      const a = out[(i - 1 + out.length) % out.length]!;
      const b = out[i]!;
      const c = out[(i + 1) % out.length]!;
      const ab = Math.hypot(b.x - a.x, b.y - a.y);
      const bc = Math.hypot(c.x - b.x, c.y - b.y);
      const turn = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (ab < 1e-9 || bc < 1e-9 || Math.abs(turn) <= 1e-9 * ab * bc) {
        out.splice(i, 1);
        changed = true;
        i--;
      }
    }
  }
  return out;
}

const num = (x: number) => String(Math.round(x * 1000) / 1000);

function extentOf(lines: FlatLines) {
  const all = [...lines.cut, ...lines.engrave].flat();
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** The lines as an SVG drawing in millimetres: the cut in red, the
 * engraving in blue, each a layer of its own. */
export function svg(lines: FlatLines, title = 'Tastir'): string {
  const { x0, x1, y0, y1 } = extentOf(lines);
  const w = x1 - x0;
  const h = y1 - y0;
  const path = (loop: readonly P2[]) =>
    'M' + loop.map((p) => `${num(p.x - x0)} ${num(y1 - p.y)}`).join(' L') + ' Z';
  const layer = (id: string, colour: string, loops: readonly P2[][]) =>
    `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}" fill="none" stroke="${colour}" stroke-width="0.1">\n` +
    loops.map((l) => `<path d="${path(l)}"/>\n`).join('') +
    '</g>\n';
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${num(w)}mm" height="${num(h)}mm" viewBox="0 0 ${num(w)} ${num(h)}">\n` +
    `<title>${title.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)}</title>\n` +
    layer('cut', '#d0021b', lines.cut) +
    layer('engrave', '#1f5fbf', lines.engrave) +
    '</svg>\n'
  );
}

/** The lines as a DXF drawing (R12, which every CAM program reads), in
 * millimetres: closed polylines on the layers CUT and ENGRAVE. */
export function dxf(lines: FlatLines): string {
  const out: string[] = [];
  const pair = (code: number, value: string | number) => out.push(String(code), String(value));
  pair(0, 'SECTION');
  pair(2, 'HEADER');
  pair(9, '$ACADVER');
  pair(1, 'AC1009');
  pair(0, 'ENDSEC');
  pair(0, 'SECTION');
  pair(2, 'TABLES');
  pair(0, 'TABLE');
  pair(2, 'LAYER');
  pair(70, 2);
  for (const [name, colour] of [
    ['CUT', 1],
    ['ENGRAVE', 5],
  ] as const) {
    pair(0, 'LAYER');
    pair(2, name);
    pair(70, 0);
    pair(62, colour);
    pair(6, 'CONTINUOUS');
  }
  pair(0, 'ENDTAB');
  pair(0, 'ENDSEC');
  pair(0, 'SECTION');
  pair(2, 'ENTITIES');
  const polyline = (layer: string, loop: readonly P2[]) => {
    pair(0, 'POLYLINE');
    pair(8, layer);
    pair(66, 1);
    pair(10, 0);
    pair(20, 0);
    pair(30, 0);
    pair(70, 1);
    for (const p of loop) {
      pair(0, 'VERTEX');
      pair(8, layer);
      pair(10, num(p.x));
      pair(20, num(p.y));
      pair(30, 0);
    }
    pair(0, 'SEQEND');
    pair(8, layer);
  };
  for (const loop of lines.cut) polyline('CUT', loop);
  for (const loop of lines.engrave) polyline('ENGRAVE', loop);
  pair(0, 'ENDSEC');
  pair(0, 'EOF');
  return out.join('\n') + '\n';
}
