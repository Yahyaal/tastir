// Turns a tutorial into a carved panel: a binary STL for the slicer and
// two pictures in raking light, written to docs/review/relief-<id>/ with a
// page at http://localhost:4200/__review/renders/relief-<id>/index.html.
//
//   pnpm relief <id> [--width 200] [--height 200] [--repeat 100]
//     [--thickness 12] [--depth 8] [--band 3] [--frame 0] [--draft 6]
//     [--carving facets|flat|cushion|raised] [--slope 35] [--rise 3]
//     [--kind 2=cushion --kind 3=raised ...]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { loadModel } from '../packages/project-core/src/model.ts';
import {
  openEdges,
  picture,
  relief,
  stl,
  volumeOf,
  type Carving,
  type Mesh,
} from '../packages/relief/src/index.ts';

const args = process.argv.slice(2);
const id = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!id) {
  console.error('usage: pnpm relief <tutorial-id> [--width mm] [--repeat mm] ...');
  process.exit(2);
}
const option = (name: string, fallback: number) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? Number(args[at + 1]) : fallback;
};
const word = (name: string, fallback: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1]! : fallback;
};
const width = option('width', 200);
const height = option('height', width);
const repeat = option('repeat', 100);
const thickness = option('thickness', 12);
const depth = option('depth', 8);
const band = option('band', 3);
const frame = option('frame', 0);
const draft = option('draft', 6);
const slope = option('slope', 35);
const rise = option('rise', 3);

function carvingNamed(name: string): Carving {
  switch (name) {
    case 'raised':
      return { kind: 'raised' };
    case 'flat':
      return { kind: 'flat', depth, draft };
    case 'cushion':
      return { kind: 'cushion', depth, draft, rise };
    case 'facets':
      return { kind: 'facets', slope, depth };
    default:
      throw new Error(`No carving called ${name}: use facets, flat, cushion or raised.`);
  }
}
const all = carvingNamed(word('carving', 'facets'));
const byKind = new Map<number, Carving>();
args.forEach((a, i) => {
  if (a !== '--kind') return;
  const [k, name] = (args[i + 1] ?? '').split('=');
  byKind.set(Number(k) - 1, carvingNamed(name ?? ''));
});

const model = loadModel(
  JSON.parse(readFileSync(new URL(`../tutorials/${id}.json`, import.meta.url), 'utf8')),
);
const { pattern } = model;
const { u } = pattern.cell;
const scale = repeat / Math.hypot(u.x, u.y);
const started = performance.now();
const mesh = relief(pattern, {
  width,
  height,
  scale,
  thickness,
  band,
  frame,
  carving: (type) => byKind.get(type) ?? all,
});
const took = performance.now() - started;
const open = openEdges(mesh);
if (open) throw new Error(`The mesh is not closed: ${open} edges are open.`);
const volume = volumeOf(mesh);

const out = new URL(`../docs/review/relief-${id}/`, import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL(`${id}.stl`, out), stl(mesh, `Tastir ${id}`));

function render(m: Mesh, tilt: number, spin: number, size: number): Uint8Array {
  const w = size;
  const h = Math.round(size * 0.8);
  const rgba = picture(m, {
    width: w,
    height: h,
    tilt,
    spin,
    light: 35,
    background: [0.93, 0.92, 0.9],
    material: [0.95, 0.92, 0.86],
  });
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let ch = 0; ch < 3; ch++)
        raw[y * (w * 3 + 1) + 1 + x * 3 + ch] = rgba[(y * w + x) * 4 + ch]!;
  return png(w, h, raw);
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function png(w: number, h: number, raw: Uint8Array): Uint8Array {
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out.set(new TextEncoder().encode(type), 4);
    out.set(data, 8);
    view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
    return out;
  };
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, w);
  v.setUint32(4, h);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ];
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

writeFileSync(new URL('front.png', out), render(mesh, 0, 0, 1100));
writeFileSync(new URL('angle.png', out), render(mesh, 55, 20, 1100));

const grams = (volume / 1000) * 1.24; // PLA, solid
const summary = [
  `${model.tutorial.title}`,
  `${width} × ${height} × ${thickness} mm, one repeat ${repeat} mm, bands ${band} mm, carved ${depth} mm`,
  `${mesh.triangles.length / 3} triangles, closed, ${(volume / 1000).toFixed(1)} cm³ (${grams.toFixed(0)} g of PLA if printed solid)`,
  `made in ${(took / 1000).toFixed(2)} s`,
];
writeFileSync(
  new URL('index.html', out),
  `<!doctype html><meta charset="utf-8"><title>Relief: ${id}</title>
<style>body{font:16px system-ui;margin:24px;max-width:1150px;color:#222;background:#faf8f4}
img{width:100%;border:1px solid #ddd;margin:8px 0 20px}a{color:#0a6a73}</style>
<h1>${model.tutorial.title}: carved panel</h1>
<p>${summary.slice(1).join('<br>')}</p>
<p><a href="${id}.stl" download>Download ${id}.stl</a> and open it in Bambu Studio.</p>
<h2>Face on, in low light from the upper left</h2><img src="front.png" alt="The panel seen face on">
<h2>At an angle</h2><img src="angle.png" alt="The panel seen at an angle">`,
);
console.log(summary.join('\n'));
console.log(`http://localhost:4200/__review/renders/relief-${id}/index.html`);
