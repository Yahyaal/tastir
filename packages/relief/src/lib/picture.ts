import type { Mesh } from './mesh.js';

export type V3 = [number, number, number];
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

export interface PictureOptions {
  /** The picture's size in pixels. */
  readonly width: number;
  readonly height: number;
  /** How far the view leans from straight above, and turns round, in degrees. */
  readonly tilt: number;
  readonly spin: number;
  /** Where the light comes from round the object, in degrees (0: the left). */
  readonly light: number;
  /** Colours as red, green and blue from 0 to 1. */
  /** Left out, the background is transparent. */
  readonly background?: readonly [number, number, number];
  readonly material: readonly [number, number, number];
}

/** The light's direction: `angle` round the object, 28° above the table. */
export function sunFrom(angle: number): V3 {
  const a = (angle * Math.PI) / 180;
  const low = (28 * Math.PI) / 180;
  return [-Math.cos(a) * Math.cos(low), Math.sin(a) * Math.cos(low), Math.sin(low)];
}

/**
 * A picture of a mesh in low light with shadows, drawn without a GPU (a
 * depth buffer per pixel and a shadow map from the light): for pages
 * where WebGL is missing, and for the review pictures. RGBA, row by row
 * from the top.
 */
export function picture(mesh: Mesh, o: PictureOptions): Uint8ClampedArray {
  const S = 2; // supersampling
  const W = o.width * S;
  const H = o.height * S;
  const tilt = (o.tilt * Math.PI) / 180;
  const spin = (o.spin * Math.PI) / 180;
  const view = rotation(tilt, spin);
  const fit = fitOf(mesh, view, W, H, 16 * S);
  const { zb, id } = depthMap(mesh, view, W, H, fit);
  const sun = sunFrom(o.light);
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
  const back = o.background ?? [0, 0, 0];
  const cover = new Uint8Array(W * H);
  const plaster = o.material;
  for (let at = 0; at < W * H; at++) {
    const k = id[at]!;
    if (k >= 0) cover[at] = 1;
    let col: readonly number[] = back;
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
  // Down-sample. Without a background, only the object's own samples
  // give the colour, and the share of them gives the opacity.
  const out = new Uint8ClampedArray(o.width * o.height * 4);
  for (let y = 0; y < o.height; y++)
    for (let x = 0; x < o.width; x++) {
      let covered = 0;
      const sum = [0, 0, 0];
      for (let dy = 0; dy < S; dy++)
        for (let dx = 0; dx < S; dx++) {
          const at = (y * S + dy) * W + x * S + dx;
          if (!o.background && !cover[at]) continue;
          covered += cover[at]!;
          for (let ch = 0; ch < 3; ch++) sum[ch]! += img[at * 3 + ch]!;
        }
      const n = o.background ? S * S : covered;
      const px = (y * o.width + x) * 4;
      for (let ch = 0; ch < 3; ch++)
        out[px + ch] = n ? Math.round(Math.pow(Math.min(1, sum[ch]! / n), 1 / 1.1) * 255) : 0;
      out[px + 3] = o.background ? 255 : Math.round((covered / (S * S)) * 255);
    }
  return out;
}
