import type { Mesh } from './mesh.js';

/** A mesh as a binary STL file (millimetres, as slicers expect). */
export function stl(mesh: Mesh, name = 'Tastir relief'): Uint8Array {
  const { positions: p, triangles } = mesh;
  const count = triangles.length / 3;
  const bytes = new Uint8Array(84 + count * 50);
  const view = new DataView(bytes.buffer);
  // The header is plain ASCII; the engine's packages have no DOM types.
  for (let i = 0; i < Math.min(80, name.length); i++)
    bytes[i] = name.charCodeAt(i) < 128 ? name.charCodeAt(i) : 63;
  view.setUint32(80, count, true);
  let at = 84;
  for (let t = 0; t < triangles.length; t += 3) {
    const a = triangles[t]! * 3;
    const b = triangles[t + 1]! * 3;
    const c = triangles[t + 2]! * 3;
    const ux = p[b]! - p[a]!;
    const uy = p[b + 1]! - p[a + 1]!;
    const uz = p[b + 2]! - p[a + 2]!;
    const vx = p[c]! - p[a]!;
    const vy = p[c + 1]! - p[a + 1]!;
    const vz = p[c + 2]! - p[a + 2]!;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (const value of [nx, ny, nz]) {
      view.setFloat32(at, value, true);
      at += 4;
    }
    for (const i of [a, b, c])
      for (let k = 0; k < 3; k++) {
        view.setFloat32(at, p[i + k]!, true);
        at += 4;
      }
    at += 2;
  }
  return bytes;
}
