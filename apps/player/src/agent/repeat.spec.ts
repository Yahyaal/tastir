import { evaluate, cross, sub } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import source from '@tutorials/eight-fold-star-and-octagon.json';
import hexSource from '@tutorials/six-fold-star-and-hexagons.json';
import { loadModel } from '../app/model';
import { placeFills } from '../app/placement';
import { tutorialColoring } from '../app/coloring';
import { editSegments, emptyDrawing, travelDrawing } from './drawing';
import {
  paintPattern,
  repeatModel,
  repeatObservation,
  repeatTargets,
  savedDrawing,
  setTile,
} from './repeat';

const tutorial = parseTutorial(source);
const scene = evaluate(tutorial);
const outer = ['N', 'E', 'S', 'W'];
const inner = ['jN', 'jE', 'jS', 'jW'];
const loop = (points: string[]) =>
  points.map((from, i) => ({ from, to: points[(i + 1) % points.length]! }));
const inked = () =>
  editSegments(
    emptyDrawing(),
    {
      add: [
        ...loop(outer),
        ...loop(inner),
        ...outer.map((from, i) => ({ from, to: inner[i]! })),
      ],
      remove: [],
    },
    scene,
  );

describe('assistant repeating tiles and colors', () => {
  it('closes the named tile with the engine, covers its exact area, and repeats matching polygons', () => {
    const state = setTile(inked(), { vertices: outer }, tutorial);
    const model = repeatModel(tutorial, state)!;
    expect(model.pattern.types.map((t) => [t.name, t.perCell])).toEqual([
      ['square', 1],
      ['quadrilateral', 4],
    ]);
    expect(
      model.pattern.types.reduce((s, t) => s + t.area * t.perCell, 0),
    ).toBeCloseTo(model.pattern.cell.area, 10);
    const targets = repeatTargets(model, {
      minX: -2,
      minY: -2,
      maxX: 2,
      maxY: 2,
    });
    const a = targets.find((t) => t.id === 'piece0@0,0')!.geometry;
    const b = targets.find((t) => t.id === 'piece0@1,0')!.geometry;
    if (a.kind !== 'polygon' || b.kind !== 'polygon')
      throw new Error('Expected polygons');
    expect(sub(b.vertices[0]!, a.vertices[0]!)).toEqual(model.pattern.cell.u);
    expect(
      Math.abs(cross(model.pattern.cell.u, model.pattern.cell.v)),
    ).toBeCloseTo(model.pattern.cell.area, 10);
    expect(() =>
      repeatTargets(model, { minX: -1e6, minY: -1e6, maxX: 1e6, maxY: 1e6 }),
    ).toThrow('Zoom in');
  });
  it('supports a named hexagonal repeat with equal opposite sides', () => {
    const hex = parseTutorial(hexSource);
    const vertices = ['E', 'P60', 'P120', 'W', 'P240', 'P300'];
    const ink = editSegments(
      emptyDrawing(),
      { add: loop(vertices), remove: [] },
      evaluate(hex),
    );
    const state = setTile(ink, { vertices }, hex);
    const model = repeatModel(hex, state)!;
    expect(model.pattern.types).toHaveLength(1);
    expect(model.pattern.types[0]!.name).toBe('hexagon');
    expect(model.pattern.types[0]!.perCell).toBe(1);
    expect(model.pattern.types[0]!.area).toBeCloseTo(
      model.pattern.cell.area,
      10,
    );
  });
  it('rejects open ink, nested disconnected outlines, non-tiles and crossed corner orders atomically', () => {
    const state = inked();
    for (const vertices of [
      ['N', 'E', 'S', 'O'],
      ['N', 'S', 'E', 'W'],
      ['N', 'E', 'S', 'N'],
      ['N', 'E', 'S', 'missing'],
      ['N', 'E', 'S', 'W', 'O'],
    ])
      expect(() => setTile(state, { vertices }, tutorial)).toThrow();
    const open = editSegments(
      emptyDrawing(),
      { add: loop(inner).slice(0, 3), remove: [] },
      scene,
    );
    expect(() => setTile(open, { vertices: outer }, tutorial)).toThrow();
    const nested = editSegments(
      emptyDrawing(),
      { add: [...loop(outer), ...loop(inner)], remove: [] },
      scene,
    );
    expect(() => setTile(nested, { vertices: outer }, tutorial)).toThrow(
      'cover',
    );
    const loose = editSegments(
      state,
      { add: [{ from: 'jN', to: 'O' }], remove: [] },
      scene,
    );
    expect(() => setTile(loose, { vertices: outer }, tutorial)).toThrow(
      'loose end',
    );
    expect(state.repeat).toBeNull();
  });
  it('saves exact shape colors into a normal playable tutorial and restores tile/colors with Undo', () => {
    const ink = inked();
    const tiled = setTile(ink, { vertices: outer }, tutorial);
    const colored = paintPattern(
      tiled,
      {
        palette: null,
        colors: [
          { typeId: 'square', color: '#2453A6' },
          { typeId: 'quadrilateral', color: '#dda83b' },
        ],
      },
      tutorial,
    );
    const saved = loadModel(savedDrawing(tutorial, colored));
    const fills = placeFills(saved, tutorialColoring(saved));
    for (const [i, p] of saved.pattern.pieces.entries())
      expect(fills(i, 2, -3)).toBe(
        saved.pattern.types[p.type]!.name === 'square' ? '#2453a6' : '#dda83b',
      );
    expect(
      repeatObservation(saved, colored.repeat!).types.map((t) => t.color),
    ).toEqual(['#2453a6', '#dda83b']);
    const undone = travelDrawing(colored, 'undo');
    expect(undone.repeat).toEqual(tiled.repeat);
    expect(travelDrawing(undone, 'undo').repeat).toBeNull();
    expect(travelDrawing(undone, 'redo').repeat).toEqual(colored.repeat);
    const changed = editSegments(
      colored,
      { add: [], remove: [colored.segments[0]!.id] },
      scene,
    );
    expect(changed.repeat).toBeNull();
    expect(travelDrawing(changed, 'undo').repeat).toEqual(colored.repeat);
    const palette = paintPattern(
      colored,
      { palette: 'Alhambra', colors: [] },
      tutorial,
    );
    expect(palette.repeat!.colors).toEqual({});
    expect(travelDrawing(palette, 'undo').repeat).toEqual(colored.repeat);
  });
  it('rejects invalid colors, unknown or duplicate type IDs and unknown palettes without partial paint', () => {
    const state = setTile(inked(), { vertices: outer }, tutorial);
    for (const request of [
      { palette: 'missing', colors: [] },
      {
        palette: null,
        colors: [{ typeId: 'square', color: 'url(https://example.com)' }],
      },
      { palette: null, colors: [{ typeId: 'missing', color: '#123456' }] },
      {
        palette: null,
        colors: [
          { typeId: 'square', color: '#123456' },
          { typeId: 'square', color: '#654321' },
        ],
      },
      { palette: null, colors: [] },
    ])
      expect(() => paintPattern(state, request, tutorial)).toThrow();
    expect(state.repeat!.colors).toEqual({});
    expect(() =>
      paintPattern(inked(), { palette: 'Alhambra', colors: [] }, tutorial),
    ).toThrow('tile');
  });
});
