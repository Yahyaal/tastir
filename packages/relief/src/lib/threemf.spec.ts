import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32 as nodeCrc } from 'node:zlib';
import { relief, round } from './relief.js';
import { crc32, threeMf, utf8 } from './threemf.js';
import { volumeOf } from './mesh.js';

const squares = {
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
};

describe('3MF', () => {
  it('computes the same checksum as zlib', () => {
    const data = utf8('Tastir تسطير 3MF');
    expect(crc32(data)).toBe(nodeCrc(data));
  });

  it('is a zip that unzip reads, with the model in millimetres', () => {
    const mesh = relief(squares, {
      width: 0,
      height: 0,
      outline: round(60),
      scale: 20,
      thickness: 8,
      band: 2,
      frame: 3,
      carving: () => ({ kind: 'facets', slope: 40, depth: 5 }),
    });
    const dir = mkdtempSync(join(tmpdir(), 'tastir-3mf-'));
    const file = join(dir, 'panel.3mf');
    writeFileSync(file, threeMf(mesh, 'Round <panel>'));
    const listing = execFileSync('unzip', ['-t', file], { encoding: 'utf8' });
    expect(listing).toMatch(/No errors detected/);
    execFileSync('unzip', ['-q', '-o', file, '-d', dir]);
    const model = readFileSync(join(dir, '3D', '3dmodel.model'), 'utf8');
    expect(model).toContain('unit="millimeter"');
    expect(model).toContain('Round &#60;panel&#62;');
    // Read the triangles back and find the same volume.
    const v = [...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map((m) =>
      [m[1], m[2], m[3]].map(Number),
    );
    const t = [...model.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].map((m) =>
      [m[1], m[2], m[3]].map(Number),
    );
    expect(t.length).toBe(mesh.triangles.length / 3);
    const read = {
      positions: Float64Array.from(v.flat()),
      triangles: Uint32Array.from(t.flat()),
    };
    expect(volumeOf(read)).toBeCloseTo(volumeOf(mesh), 0);
  });

  it('holds each part as its own named object', () => {
    const mesh = relief(squares, {
      width: 40,
      height: 40,
      scale: 20,
      thickness: 8,
      band: 2,
      frame: 0,
      carving: () => ({ kind: 'flat', depth: 4, draft: 6 }),
    });
    const dir = mkdtempSync(join(tmpdir(), 'tastir-3mf-'));
    const file = join(dir, 'parts.3mf');
    writeFileSync(file, threeMf([{ name: 'A1', mesh }, { name: 'B1', mesh }], 'Panel'));
    execFileSync('unzip', ['-q', '-o', file, '-d', dir]);
    const model = readFileSync(join(dir, '3D', '3dmodel.model'), 'utf8');
    expect([...model.matchAll(/<object id="(\d)" name="([^"]+)"/g)].map((m) => m[2])).toEqual(['A1', 'B1']);
    expect(model.match(/<item objectid=/g)).toHaveLength(2);
  });
});
