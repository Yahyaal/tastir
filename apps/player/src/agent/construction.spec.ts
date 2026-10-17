import { DraftShape, type Tutorial } from '@tastir/schema';
import { inkStrokes } from '@tastir/engine';
import type { Construction } from '@tastir/agent-protocol';
import { emptyDraft, check } from '../editor/document';
import {
  construct,
  constructionScene,
  drawingDraft,
  editSegments,
  emptyDrawing,
  travelDrawing,
} from './drawing';

const blank = emptyDraft('agent-blank', 'Compass construction');
const compass: Construction[] = [
  { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
  { kind: 'circle', name: 'C1', centre: 'A', through: 'O' },
  { kind: 'intersection', name: 'Top', first: 'C0', second: 'C1', angle: 90 },
  {
    kind: 'intersection',
    name: 'Bottom',
    first: 'C0',
    second: 'C1',
    angle: 270,
  },
  { kind: 'line', name: 'Axis', from: 'Top', to: 'Bottom' },
];
const make = () =>
  construct(emptyDrawing(), { add: compass, remove: [] }, blank);

describe('agent ruler and compass construction', () => {
  it('builds two unit circles, two exact intersections and their ruler line from only O and A', () => {
    const made = make();
    const scene = constructionScene(blank, made.constructions);
    for (const name of ['C0', 'C1'])
      expect(scene.elements.get(name)?.geometry).toMatchObject({
        kind: 'circle',
        circle: { radius: 1 },
      });
    const top = scene.elements.get('Top')!.geometry;
    const bottom = scene.elements.get('Bottom')!.geometry;
    if (top.kind !== 'point' || bottom.kind !== 'point')
      throw new Error('Missing intersections');
    expect(top.at.x).toBeCloseTo(0.5, 12);
    expect(top.at.y).toBeCloseTo(Math.sqrt(3) / 2, 12);
    expect(bottom.at.x).toBeCloseTo(0.5, 12);
    expect(bottom.at.y).toBeCloseTo(-Math.sqrt(3) / 2, 12);
    expect(scene.elements.get('Axis')?.deps).toEqual(['Top', 'Bottom']);
    const undone = travelDrawing(made, 'undo');
    expect(undone.constructions).toEqual([]);
    expect(undone.revision).toBeGreaterThan(made.revision);
    expect(travelDrawing(undone, 'redo').constructions).toEqual(compass);
  });
  it('rejects the entire batch for ambiguous, impossible, forward or wrong-kind references', () => {
    const initial = emptyDrawing();
    const bad: Construction[][] = [
      [
        ...compass.slice(0, 2),
        {
          kind: 'intersection',
          name: 'P',
          first: 'C0',
          second: 'C1',
          angle: null,
        },
      ],
      [{ kind: 'line', name: 'L', from: 'O', to: 'O' }],
      [{ kind: 'circle', name: 'C', centre: 'O', through: 'O' }],
      [
        { kind: 'line', name: 'L', from: 'Top', to: 'Bottom' },
        ...compass.slice(0, 4),
      ],
      [
        ...compass.slice(0, 2),
        { kind: 'line', name: 'L', from: 'C0', to: 'A' },
      ],
      [{ kind: 'circle', name: 'O', centre: 'O', through: 'A' }],
      [
        { kind: 'line', name: 'L', from: 'O', to: 'A' },
        { kind: 'line', name: 'L', from: 'O', to: 'A' },
      ],
      [
        { kind: 'line', name: 'L', from: 'O', to: 'A' },
        {
          kind: 'intersection',
          name: 'P',
          first: 'L',
          second: 'L',
          angle: null,
        },
      ],
    ];
    for (const add of bad)
      expect(() => construct(initial, { add, remove: [] }, blank)).toThrow();
    expect(initial.constructions).toEqual([]);
    expect(initial.past).toEqual([]);
  });
  it('uses new points in finite ink and saves all dependencies without coordinates', () => {
    const made = make();
    const withSide = editSegments(
      made,
      { add: [{ from: 'Top', to: 'Bottom' }], remove: [] },
      constructionScene(blank, made.constructions),
    );
    const draft = drawingDraft(
      blank,
      withSide.segments,
      withSide.constructions,
    );
    expect(DraftShape.safeParse(draft).success).toBe(true);
    expect(draft.steps).toHaveLength(6);
    expect(draft.credits).toEqual([]);
    expect(inkStrokes(check(draft).scene, draft as Tutorial)).toHaveLength(1);
    const back = travelDrawing(withSide, 'undo');
    expect(back.segments).toEqual([]);
    expect(back.constructions).toEqual(compass);
    expect(() =>
      construct(withSide, { add: [], remove: ['Top'] }, blank),
    ).toThrow();
    expect(() => construct(made, { add: [], remove: ['C0'] }, blank)).toThrow();
    expect(
      construct(made, { add: [], remove: compass.map((op) => op.name) }, blank)
        .constructions,
    ).toEqual([]);
  });
  it('keeps a construction-only draft before any finite ink is drawn', () => {
    const made = make();
    const draft = drawingDraft(blank, [], made.constructions);
    expect(DraftShape.safeParse(draft).success).toBe(true);
    expect(draft.ink).toBeUndefined();
    expect([...check(draft).status.values()].every((s) => s.ok)).toBe(true);
    expect(() => construct(made, { add: [], remove: ['O'] }, blank)).toThrow();
  });
});
