import type { Construction } from '@tastir/agent-protocol';
import { CallShape, ConstructionShape } from '@tastir/agent-protocol';
import {
  construct as studioConstruct,
  sceneOf,
} from '@tastir/project-core/ops';
import {
  constructionReferences,
  constructionSpec,
  constructionText,
} from '@tastir/project-core/drawing';
import { addStep, check, emptyDraft } from '../editor/document';
import {
  buildStep,
  snap,
  toolOf,
  type Target,
  type ToolId,
} from '../editor/tools';
import { construct, constructionScene, emptyDrawing } from './drawing';
import { checkedDraftEdit } from './pageEditor';

const blank = emptyDraft('agent-blank', 'Editor parity');
const setup: Construction[] = [
  { kind: 'circle', name: 'C', centre: 'O', through: 'A' },
  { kind: 'line', name: 'H', from: 'O', to: 'A' },
  { kind: 'perpendicular', name: 'V', through: 'O', perpendicularTo: 'H' },
  { kind: 'intersection', name: 'N', first: 'C', second: 'V', angle: 90 },
  { kind: 'intersection', name: 'W', first: 'C', second: 'H', angle: 180 },
  { kind: 'circle', name: 'Shift', centre: 'N', through: 'O' },
];
const draft = studioConstruct(blank, setup);
const point = (name: string): Target => {
  const g = sceneOf(draft).elements.get(name)!.geometry;
  if (g.kind !== 'point') throw new Error('Expected a fixture point');
  return { kind: 'point', name, at: g.at };
};
const element = (name: string): Target => ({ kind: 'element', name });

const cases: { op: Construction; tool: ToolId; targets: Target[] }[] = [
  {
    op: {
      kind: 'perpendicular',
      name: 'Perp',
      through: 'A',
      perpendicularTo: 'H',
    },
    tool: 'square',
    targets: [element('H'), point('A')],
  },
  {
    op: { kind: 'parallel', name: 'Par', through: 'N', parallelTo: 'H' },
    tool: 'parallel',
    targets: [element('H'), point('N')],
  },
  {
    op: { kind: 'bisector', name: 'Half', bisects: ['A', 'O', 'N'] },
    tool: 'halve',
    targets: [point('A'), point('O'), point('N')],
  },
  {
    op: { kind: 'same-opening', name: 'Same', centre: 'N', radiusOf: 'C' },
    tool: 'same',
    targets: [element('C'), point('N')],
  },
  {
    op: {
      kind: 'opening-from-points',
      name: 'Span',
      centre: 'N',
      radiusFrom: ['A', 'W'],
    },
    tool: 'span',
    targets: [point('A'), point('W'), point('N')],
  },
  ...(['near', 'far'] as const).map((touch) => ({
    op: {
      kind: 'touching' as const,
      name: 'Touch',
      centre: 'W',
      tangentTo: ['Shift'],
      ...(touch ? { touch } : {}),
    },
    tool: 'touch' as const,
    targets: [point('W'), element('Shift')],
  })),
  {
    op: { kind: 'touching', name: 'Concentric', centre: 'O', tangentTo: ['C'] },
    tool: 'touch',
    targets: [point('O'), element('C')],
  },
  {
    op: { kind: 'touching', name: 'TouchLines', centre: 'A', tangentTo: ['V'] },
    tool: 'touch',
    targets: [point('A'), element('V')],
  },
  {
    op: { kind: 'polygon', name: 'Poly', vertices: ['A', 'N', 'W'] },
    tool: 'polygon',
    targets: [point('A'), point('N'), point('W')],
  },
  {
    op: { kind: 'point', name: 'P', meet: ['H', 'V'] },
    tool: 'point',
    targets: [{ kind: 'point', at: { x: 0, y: 0 }, meet: ['H', 'V'] }],
  },
];
for (const pick of [
  { angle: 90 },
  { nearest: 'N' },
  { farthest: 'N' },
  { inside: 'Shift' },
  { outside: 'Shift' },
]) {
  cases.push({
    op: { kind: 'point', name: 'Picked', meet: ['C', 'V'], pick },
    tool: 'point',
    targets: [
      {
        kind: 'point',
        at: { x: 0, y: 'farthest' in pick || 'outside' in pick ? -1 : 1 },
        meet: ['C', 'V'],
        pick,
      },
    ],
  });
}
// Let the editor itself choose a real crossing rule, as it does after a click.
const crossing = snap(sceneOf(draft), { x: 0, y: -1 }, 0.01, 'point')!;
if (crossing.kind !== 'point' || !crossing.meet)
  throw new Error('Expected unnamed crossing');
cases.push({
  op: {
    kind: 'point',
    name: 'South',
    meet: [...crossing.meet],
    ...(crossing.pick ? { pick: crossing.pick } : {}),
  },
  tool: 'point',
  targets: [crossing],
});

describe('agent construction parity with editor tools', () => {
  it.each(cases)(
    '$op.kind makes the editor spec and scene',
    ({ op, tool, targets }) => {
      const parsed = ConstructionShape.parse(op);
      const manual = buildStep(
        draft,
        toolOf(tool),
        targets,
        'touch' in op ? op.touch : undefined,
      );
      expect(Object.values(manual.create)).toEqual([constructionSpec(parsed)]);
      expect(constructionText(parsed)).toContain(op.name);
      const editor = addStep(draft, {
        ...manual,
        create: { [op.name]: Object.values(manual.create)[0]! },
      });
      const studio = studioConstruct(draft, [op]);
      expect(studio.steps.at(-1)!.create).toEqual(editor.steps.at(-1)!.create);
      const expected = check(editor).scene;
      expect(sceneOf(studio)).toEqual(expected);
      expect(new Set(constructionReferences(parsed))).toEqual(
        new Set(expected.elements.get(op.name)!.deps),
      );
      const normalEditor = checkedDraftEdit(
        draft,
        CallShape.parse({
          id: 'parity',
          name: 'construct',
          arguments: {
            snapshotId: 's',
            documentRevision: 'r',
            label: 'Editor parity',
            add: [op],
            remove: [],
          },
        }),
      );
      expect(sceneOf(normalEditor)).toEqual(expected);
      const workspace = construct(
        emptyDrawing(),
        { add: [op], remove: [] },
        draft,
      );
      expect(constructionScene(draft, workspace.constructions)).toEqual(
        check(editor).scene,
      );
    },
  );

  it('quarters an existing circle with exactly two editor steps', () => {
    const circle = studioConstruct(blank, setup.slice(0, 1));
    const quartered = studioConstruct(circle, setup.slice(1, 3));
    expect(quartered.steps.length - circle.steps.length).toBe(2);
    expect(quartered.steps.at(-1)!.create).toEqual({
      V: { line: { through: 'O', perpendicularTo: 'H' } },
    });
    expect(
      sceneOf(quartered).elements.size - sceneOf(circle).elements.size,
    ).toBe(2);
  });

  it.each([
    { kind: 'perpendicular', name: 'Bad', through: 'O', perpendicularTo: 'C' },
    { kind: 'parallel', name: 'Bad', through: 'Missing', parallelTo: 'H' },
    { kind: 'bisector', name: 'Bad', bisects: ['O', 'O', 'A'] },
    { kind: 'same-opening', name: 'Bad', centre: 'O', radiusOf: 'H' },
    {
      kind: 'opening-from-points',
      name: 'Bad',
      centre: 'O',
      radiusFrom: ['A', 'A'],
    },
    { kind: 'touching', name: 'Bad', centre: 'O', tangentTo: ['H'] },
    { kind: 'touching', name: 'Bad', centre: 'A', tangentTo: ['C', 'V'] },
    { kind: 'touching', name: 'Bad', centre: 'A', tangentTo: [] },
    {
      kind: 'touching',
      name: 'Bad',
      centre: 'W',
      tangentTo: ['Shift'],
      touch: 'outside',
    },
    { kind: 'polygon', name: 'Bad', vertices: ['A', 'N'] },
    { kind: 'polygon', name: 'Bad', vertices: ['A', 'N', 'C'] },
    { kind: 'point', name: 'Bad', meet: ['C', 'V'] },
    { kind: 'touching', name: 'Bad', centre: 'W', tangentTo: ['Shift'] },
    { kind: 'point', name: 'Bad', meet: ['H', 'V'], x: 0, y: 0 },
    { kind: 'point', name: 'Bad', meet: ['C', 'V'], pick: { index: 0 } },
    { kind: 'parallel', name: 'O', through: 'A', parallelTo: 'H' },
  ])('refuses all additions and removals for invalid $kind', (bad) => {
    const initial = studioConstruct(draft, [
      { kind: 'circle', name: 'Spare', centre: 'A', through: 'O' },
    ]);
    const before = structuredClone(initial);
    expect(() =>
      studioConstruct(
        initial,
        [
          { kind: 'parallel', name: 'Good', through: 'N', parallelTo: 'H' },
          bad,
        ],
        ['Spare'],
      ),
    ).toThrow();
    expect(initial).toEqual(before);
  });
});
