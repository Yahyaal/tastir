import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bambuProject, BAMBU_VERSION, plateColumns, plateOrigin, projectSettings, type BambuSettings } from './bambu.js';
import { volumeOf } from './mesh.js';
import { placed, plates, tilePieces } from './pieces.js';
import { rectangle } from './relief.js';

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

describe('Bambu Studio project', () => {
  it('lays plates out the way Bambu Studio does', () => {
    expect([1, 2, 3, 4, 5, 9, 10].map(plateColumns)).toEqual([1, 2, 2, 2, 3, 3, 4]);
    expect(plateOrigin(0, 5, 256)).toEqual({ x: 0, y: 0 });
    expect(plateOrigin(2, 5, 256).x).toBeCloseTo(2 * 307.2, 9);
    expect(plateOrigin(4, 5, 256)).toEqual({ x: 307.2, y: -307.2 });
  });

  it('holds every piece once, on its own plate, named, in its place', () => {
    // Two colours of squares, many to a colour, on several plates.
    const set = tilePieces(squares, {
      outline: rectangle(300, 300),
      scale: 12,
      frame: 0,
      thickness: 5,
      joint: 0.6,
      bevel: 0.6,
      colour: (_k, i, j) => ((i + j) % 2 ? '#ffffff' : '#000000'),
      frameColour: '#000000',
    });
    const packed = plates(set.pieces);
    expect(packed.length).toBeGreaterThanOrEqual(3);
    const project = packed.map((plate, n) => ({
      name: `colour ${plate.colour}, plate ${n + 1}`,
      items: plate.items.map((item, k) => ({ name: `piece ${n}-${k}`, mesh: placed(set.pieces[item.piece]!.mesh, item.angle, item.shift) })),
    }));
    const dir = mkdtempSync(join(tmpdir(), 'tastir-bambu-'));
    const file = join(dir, 'pieces.3mf');
    writeFileSync(file, bambuProject(project, 'Squares & <stars>'));
    expect(execFileSync('unzip', ['-t', file], { encoding: 'utf8' })).toMatch(/No errors detected/);
    execFileSync('unzip', ['-q', '-o', file, '-d', dir]);
    const model = readFileSync(join(dir, '3D', '3dmodel.model'), 'utf8');
    expect(model).toContain(`<metadata name="Application">BambuStudio-${BAMBU_VERSION}</metadata>`);
    expect(model).toContain('Squares &#38; &#60;stars&#62;');
    const config = readFileSync(join(dir, 'Metadata', 'model_settings.config'), 'utf8');
    const rels = readFileSync(join(dir, '3D', '_rels', '3dmodel.model.rels'), 'utf8');

    // Each plate lists its pieces once, and every piece is on one plate.
    const plateBlocks = [...config.matchAll(/<plate>([\s\S]*?)<\/plate>/g)].map((m) => m[1]!);
    expect(plateBlocks).toHaveLength(project.length);
    const onPlate = new Map<number, number>();
    plateBlocks.forEach((block, n) => {
      expect(block).toContain(`<metadata key="plater_id" value="${n + 1}"/>`);
      expect(block).toContain(`value="${project[n]!.name}"`);
      for (const m of block.matchAll(/key="object_id" value="(\d+)"/g)) {
        expect(onPlate.has(Number(m[1]))).toBe(false);
        onPlate.set(Number(m[1]), n);
      }
    });
    const total = project.reduce((a, p) => a + p.items.length, 0);
    expect(onPlate.size).toBe(total);

    // Each built object sits over its own plate, and its mesh has the
    // piece's volume.
    const items = [...model.matchAll(/<item objectid="(\d+)"[^>]*transform="([^"]+)"/g)];
    expect(items).toHaveLength(total);
    let k = 0;
    for (const [, id, transform] of items) {
      const n = onPlate.get(Number(id))!;
      const origin = plateOrigin(n, project.length, 256);
      const [x, y] = transform!.split(' ').slice(9).map(Number);
      expect(x! - origin.x).toBeGreaterThan(0);
      expect(x! - origin.x).toBeLessThan(256);
      expect(y! - origin.y).toBeGreaterThan(0);
      expect(y! - origin.y).toBeLessThan(256);
      const component = model.match(new RegExp(`<object id="${id}"[^>]*>\\s*<components>\\s*<component p:path="([^"]+)" objectid="(\\d+)"`));
      expect(component).not.toBeNull();
      expect(rels).toContain(`Target="${component![1]}"`);
      const body = readFileSync(join(dir, component![1]!.slice(1)), 'utf8');
      expect(body).toContain(`<object id="${component![2]}"`);
      const v = [...body.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map((m) => [m[1], m[2], m[3]].map(Number));
      const t = [...body.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].map((m) => [m[1], m[2], m[3]].map(Number));
      const mesh = project[n]!.items.find((_, j) => config.includes(`value="piece ${n}-${j}"`))!.mesh;
      expect(volumeOf({ positions: Float64Array.from(v.flat()), triangles: Uint32Array.from(t.flat()) })).toBeCloseTo(
        volumeOf(mesh),
        2,
      );
      k++;
    }
    expect(k).toBe(total);
  });

  it('carries the saved settings, with a filament for each colour', () => {
    const saved: BambuSettings = {
      version: '02.09.01.70',
      flush: 600,
      perFilament: ['filament_settings_id', 'nozzle_temperature', 'filament_dev_ams_drying_time', 'filament_colour'],
      config: {
        printer_model: 'Bambu Lab A1',
        filament_settings_id: ['Bambu PLA Basic @BBL A1'],
        nozzle_temperature: ['220'],
        filament_dev_ams_drying_time: ['12', '8'],
        filament_colour: ['#FFFFFF'],
        filament_self_index: ['1'],
        printable_area: ['0x0', '256x0', '256x256', '0x256'],
        flush_volumes_matrix: ['0'],
      },
    };
    const c = projectSettings(saved, ['#f1ead8', '#1d1d1b', '#d9a42a']);
    expect(c.filament_settings_id).toEqual(Array(3).fill('Bambu PLA Basic @BBL A1'));
    expect(c.nozzle_temperature).toEqual(['220', '220', '220']);
    expect(c.filament_dev_ams_drying_time).toEqual(['12', '8', '12', '8', '12', '8']);
    expect(c.filament_colour).toEqual(['#F1EAD8', '#1D1D1B', '#D9A42A']);
    expect(c.filament_self_index).toEqual(['1', '2', '3']);
    expect(c.flush_volumes_matrix).toEqual(['0', '600', '600', '600', '0', '600', '600', '600', '0']);
    expect(c.printable_area).toEqual(saved.config.printable_area);
    expect(c.printer_model).toBe('Bambu Lab A1');

    const dir = mkdtempSync(join(tmpdir(), 'tastir-bambu-'));
    const file = join(dir, 'p.3mf');
    const mesh = tilePieces(squares, {
      outline: rectangle(20, 20), scale: 10, frame: 0, thickness: 5, joint: 0, bevel: 0, colour: () => '#fff', frameColour: '#000',
    }).pieces[0]!.mesh;
    writeFileSync(
      file,
      bambuProject(
        [
          { name: 'cream', filament: 1, items: [{ name: 'a', mesh: placed(mesh, 0, { x: 100, y: 100 }) }] },
          { name: 'black', filament: 2, items: [{ name: 'b', mesh: placed(mesh, 0, { x: 100, y: 100 }) }] },
        ],
        'Two',
        { settings: saved, colours: ['#f1ead8', '#1d1d1b'] },
      ),
    );
    execFileSync('unzip', ['-q', '-o', file, '-d', dir]);
    expect(readFileSync(join(dir, '3D', '3dmodel.model'), 'utf8')).toContain('BambuStudio-02.09.01.70');
    const config = readFileSync(join(dir, 'Metadata', 'model_settings.config'), 'utf8');
    expect([...config.matchAll(/key="extruder" value="(\d)"/g)].map((m) => m[1])).toEqual(['1', '2']);
    const written = JSON.parse(readFileSync(join(dir, 'Metadata', 'project_settings.config'), 'utf8'));
    expect(written.filament_colour).toEqual(['#F1EAD8', '#1D1D1B']);
  });
});
