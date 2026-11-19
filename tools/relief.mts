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

// ---- A small renderer: z-buffer, raking light, shadow map. ----

type V3 = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};

interface View {
  /** World to view: x right, y up the picture, z toward the viewer. */
  readonly to: (p: V3) => V3;
}

function rotation(tilt: number, spin: number): View {
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  return {
    to: ([x, y, z]) => {
      const x1 = x * cs - y * ss;
      const y1 = x * ss + y * cs;
      return [x1, y1 * ct + z * st, -y1 * st + z * ct];
    },
  };
}

/** Rasterizes every triangle into a depth buffer of the given view. */
function depthMap(
  mesh: Mesh,
  view: View,
  w: number,
  h: number,
  fit: { x0: number; y0: number; s: number },
) {
  const zb = new Float32Array(w * h).fill(-Infinity);
  const id = new Int32Array(w * h).fill(-1);
  const { positions: p, triangles: t } = mesh;
  const pts: V3[] = [];
  for (let i = 0; i < p.length; i += 3) {
    const [x, y, z] = view.to([p[i]!, p[i + 1]!, p[i + 2]!]);
    pts.push([(x - fit.x0) * fit.s, h - (y - fit.y0) * fit.s, z]);
  }
  for (let k = 0; k < t.length; k += 3) {
    const a = pts[t[k]!]!;
    const b = pts[t[k + 1]!]!;
    const c = pts[t[k + 2]!]!;
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(area) < 1e-12) continue;
    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const maxX = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const maxY = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
        const w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const z = w0 * a[2] + w1 * b[2] + w2 * c[2];
        const at = y * w + x;
        if (z > zb[at]!) {
          zb[at] = z;
          id[at] = k / 3;
        }
      }
  }
  return { zb, id };
}

function fitOf(mesh: Mesh, view: View, w: number, h: number, margin: number) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  const p = mesh.positions;
  for (let i = 0; i < p.length; i += 3) {
    const [x, y] = view.to([p[i]!, p[i + 1]!, p[i + 2]!]);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const s = Math.min((w - 2 * margin) / (x1 - x0), (h - 2 * margin) / (y1 - y0));
  return { x0: x0 - (w / s - (x1 - x0)) / 2, y0: y0 - (h / s - (y1 - y0)) / 2, s };
}

function render(mesh: Mesh, tilt: number, spin: number, size: number): Uint8Array {
  const S = 2; // supersampling
  const W = size * S;
  const H = Math.round(size * 0.8) * S;
  const view = rotation(tilt, spin);
  const fit = fitOf(mesh, view, W, H, 24 * S);
  const { zb, id } = depthMap(mesh, view, W, H, fit);
  // Low sun from the upper left, as on a wall in the late afternoon.
  const sun = norm([-0.75, 0.55, 0.42]);
  // Shadow map: the panel seen from the sun, depth growing toward it.
  const right = norm([sun[1], -sun[0], 0]);
  const up: V3 = [
    sun[1] * right[2] - sun[2] * right[1],
    sun[2] * right[0] - sun[0] * right[2],
    sun[0] * right[1] - sun[1] * right[0],
  ];
  const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sunView: View = { to: (q) => [dot3(right, q), dot3(up, q), dot3(sun, q)] };
  const SM = 2400;
  const sfit = fitOf(mesh, sunView, SM, SM, 4);
  const shadow = depthMap(mesh, sunView, SM, SM, sfit).zb;
  const { positions: p, triangles: t } = mesh;
  const img = new Float32Array(W * H * 3);
  const back = [0.93, 0.92, 0.9];
  const plaster = [0.95, 0.92, 0.86];
  for (let at = 0; at < W * H; at++) {
    const k = id[at]!;
    let col = back;
    if (k >= 0) {
      const a = t[k * 3]! * 3;
      const b = t[k * 3 + 1]! * 3;
      const c = t[k * 3 + 2]! * 3;
      const ux = p[b]! - p[a]!;
      const uy = p[b + 1]! - p[a + 1]!;
      const uz = p[b + 2]! - p[a + 2]!;
      const vx = p[c]! - p[a]!;
      const vy = p[c + 1]! - p[a + 1]!;
      const vz = p[c + 2]! - p[a + 2]!;
      const n = norm([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
      // Back to world: undo the view for this pixel.
      const x = (at % W) + 0.5;
      const y = Math.floor(at / W) + 0.5;
      const vxw = x / fit.s + fit.x0;
      const vyw = (H - y) / fit.s + fit.y0;
      const vz0 = zb[at]!;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const y1 = vyw * ct - vz0 * st;
      const z = vyw * st + vz0 * ct;
      const cs = Math.cos(spin);
      const ss = Math.sin(spin);
      const wx = vxw * cs + y1 * ss;
      const wy = -vxw * ss + y1 * cs;
      const lit = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]);
      // Look the point up a little off its face, so a face does not shade itself.
      const [sx, sy, sz] = sunView.to([wx + n[0] * 0.4, wy + n[1] * 0.4, z + n[2] * 0.4]);
      const mx = Math.floor((sx - sfit.x0) * sfit.s);
      const my = Math.floor(SM - (sy - sfit.y0) * sfit.s);
      let inLight = 1;
      if (mx >= 0 && my >= 0 && mx < SM && my < SM) {
        const near = shadow[my * SM + mx]!;
        if (near > sz + 0.05) inLight = 0;
      }
      const sky = 0.32 + 0.18 * n[2];
      const shade = sky + 0.62 * lit * inLight;
      col = plaster.map((ch) => ch * shade);
    }
    img[at * 3] = col[0]!;
    img[at * 3 + 1] = col[1]!;
    img[at * 3 + 2] = col[2]!;
  }
  // Down-sample and encode.
  const w = W / S;
  const h = H / S;
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++)
      for (let ch = 0; ch < 3; ch++) {
        let s = 0;
        for (let dy = 0; dy < S; dy++)
          for (let dx = 0; dx < S; dx++) s += img[((y * S + dy) * W + x * S + dx) * 3 + ch]!;
        const v = Math.pow(Math.min(1, s / (S * S)), 1 / 1.1);
        raw[y * (w * 3 + 1) + 1 + x * 3 + ch] = Math.round(v * 255);
      }
  }
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
writeFileSync(new URL('angle.png', out), render(mesh, (55 * Math.PI) / 180, (20 * Math.PI) / 180, 1100));

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
