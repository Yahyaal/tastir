import { relief } from './relief.js';
import { stl } from './stl.js';

describe('stl', () => {
  it('writes every triangle with its outward normal, in millimetres', () => {
    const mesh = relief(
      {
        cell: { u: { x: 1, y: 0 }, v: { x: 0, y: 1 } },
        pieces: [
          {
            type: 0,
            polygon: [
              { x: -0.5, y: -0.5 },
              { x: 0.5, y: -0.5 },
              { x: 0.5, y: 0.5 },
              { x: -0.5, y: 0.5 },
            ],
          },
        ],
      },
      {
        width: 20,
        height: 20,
        scale: 20,
        thickness: 10,
        band: 2,
        frame: 0,
        carving: () => ({ kind: 'flat', depth: 4, draft: 5 }),
      },
    );
    const bytes = stl(mesh);
    const view = new DataView(bytes.buffer);
    const count = mesh.triangles.length / 3;
    expect(view.getUint32(80, true)).toBe(count);
    expect(bytes.length).toBe(84 + 50 * count);
    let up = 0;
    let highest = 0;
    for (let t = 0; t < count; t++) {
      const at = 84 + t * 50;
      if (view.getFloat32(at + 8, true) > 0.99) up++;
      for (let k = 0; k < 3; k++)
        highest = Math.max(highest, view.getFloat32(at + 12 + k * 12 + 8, true));
    }
    expect(up).toBeGreaterThan(0);
    expect(highest).toBeCloseTo(10, 5);
  });
});
