import { encodeShared, decodeShared } from '../editor/files';
import { wallSvg } from '../app/exporting';
import tutorial from '@tutorials/alhambra-arrayanes-squares.json';
import unsupported from '@tutorials/eight-fold-star-and-cross.json';
import {
  CallShape,
  SnapshotShape,
  type ToolCall,
} from '@tastir/agent-protocol';
import { ColoringShape, SharedDesignShape } from '@tastir/schema';
import { loadModel } from '../app/model';
import {
  colorReducer,
  tutorialColoring,
  typeKey,
  type History,
} from '../app/coloring';
import {
  colouredModel,
  placeFills,
  colorRepeat,
  placeKey,
  paintChosen,
} from '../app/placement';
import { squareGridTypes } from '../app/squareBands';
import {
  applyPageColor,
  pageColorObservation,
  registerPageColoring,
} from './pageColoring';

const model = loadModel(tutorial);
const colors = ['#191919', '#167d8d', '#294e8c', '#b86c25'];
const square = model.pattern.pieces.findIndex(
  (p) => model.pattern.types[p.type]?.name === 'square',
);
const targetId = `geometry:piece${square}@0,0`;
const snapshot = () =>
  SnapshotShape.parse({
    id: 's',
    documentId: 'screen:x',
    documentRevision: 'r',
    viewRevision: 'v',
    title: 'Squares',
    selected: null,
    mode: 'screen',
    image: null,
    screen: {
      route: 'x/result',
      title: 'Squares',
      description: '',
      destinations: [],
    },
    targets: [
      { id: targetId, kind: 'polygon', geometry: { typeId: 'square' } },
    ],
    ...pageColorObservation(),
  });
const paint = (target = targetId): ToolCall => ({
  id: 'paint',
  name: 'color_square_bands',
  arguments: {
    snapshotId: 's',
    documentRevision: 'r',
    targetId: target,
    colors: [...colors],
    sharedBorder: false,
    label: 'Square borders',
  },
});

describe('normal page square-band coloring', () => {
  let history: History;
  let release: () => void;
  function register() {
    release?.();
    release = registerPageColoring({
      model,
      history,
      route: 'x/result',
      dispatch: (action) => {
        history = colorReducer(history, action);
        register();
      },
    });
  }
  beforeEach(() => {
    history = { past: [], future: [], now: tutorialColoring(model) };
    register();
  });
  afterEach(() => release());

  it('paints exact 1/3/5/7 square borders, repeats them, and preserves every other placement color', () => {
    const before = placeFills(model, history.now);
    applyPageColor(paint(), snapshot(), 'request');
    expect(history.past).toHaveLength(1);
    const coloured = colouredModel(model, history.now);
    const fill = placeFills(coloured, history.now);
    expect(colorRepeat(coloured)).toEqual([42, 42]);
    for (let i = -10; i <= 10; i++)
      for (let j = -10; j <= 10; j++) {
        const distance = (n: number) =>
          Math.min(((n % 7) + 7) % 7, 7 - (((n % 7) + 7) % 7));
        expect(fill(square, i, j)).toBe(
          colors[Math.max(distance(i), distance(j))],
        );
        model.pattern.pieces.forEach((p, k) => {
          if (k !== square) expect(fill(k, i, j)).toBe(before(k, i, j));
        });
      }
    expect(
      SharedDesignShape.parse({
        name: 'Bands',
        coloring: history.now,
        look: 'tiles',
        grout: 1,
      }).coloring,
    ).toEqual(history.now);
    expect(
      ColoringShape.parse(JSON.parse(JSON.stringify(history.now))),
    ).toEqual(history.now);
  });

  it('round-trips through a real share payload and exports the effective colors', async () => {
    applyPageColor(paint(), snapshot(), 'request');
    const shared = {
      library: model.tutorial.id,
      design: {
        name: 'Square bands',
        coloring: history.now,
        look: 'tiles' as const,
        grout: 1,
      },
    };
    expect(await decodeShared(await encodeShared(shared))).toEqual(shared);
    const coloured = colouredModel(model, history.now);
    const svg = wallSvg(coloured, [], {
      fill: placeFills(coloured, history.now),
      across: 8,
      down: 8,
    });
    for (const color of colors) expect(svg).toContain(color);
  });

  it('uses the actual normal history for one-step Undo and Redo, including authorship', () => {
    const initial = history.now;
    applyPageColor(paint(), snapshot(), 'request');
    const painted = history.now;
    expect(pageColorObservation().history?.undo[0]?.source).toBe('assistant');
    const travel = (direction: 'undo' | 'redo'): ToolCall => ({
      id: direction,
      name: 'travel_history',
      arguments: {
        snapshotId: 's',
        documentRevision: 'r',
        label: direction,
        direction,
        scope: 'assistant',
        steps: 1,
      },
    });
    applyPageColor(travel('undo'), snapshot(), 'next');
    expect(history.now).toEqual(initial);
    applyPageColor(travel('redo'), snapshot(), 'next');
    expect(history.now).toEqual(painted);
    history = colorReducer(history, {
      kind: 'paint',
      type: 'star',
      color: '#ffffff',
    });
    register();
    expect(() => applyPageColor(travel('undo'), snapshot(), 'next')).toThrow(
      /manual/,
    );
  });

  it('rejects unknown targets and invalid colors before changing anything', () => {
    expect(() =>
      applyPageColor(paint('geometry:piece999@0,0'), snapshot(), 'request'),
    ).toThrow(/visible/);
    const call = paint();
    if (call.name === 'color_square_bands') call.arguments.colors[0] = 'red';
    expect(() => applyPageColor(call, snapshot(), 'request')).toThrow();
    expect(history.past).toHaveLength(0);
    const other = loadModel(unsupported);
    expect(squareGridTypes(other)).toEqual([]);
    const unsuitable = {
      ...history.now,
      squareBands: {
        typeId: 'square',
        centre: [0, 0] as [number, number],
        colors,
      },
    };
    expect(() => colouredModel(other, unsuitable)).not.toThrow();
  });
  it('shares one outer border between neighboring 9×9 motifs and round-trips it', () => {
    const command = paint();
    if (command.name !== 'color_square_bands') throw new Error('wrong fixture');
    command.arguments.colors = [...colors, '#000000'];
    command.arguments.sharedBorder = true;
    applyPageColor(command, snapshot(), 'request');
    expect(history.now.squareBands?.sharedBorder).toBe(true);
    const rendered = colouredModel(model, history.now);
    const fill = placeFills(rendered, history.now);
    expect(colorRepeat(rendered)).toEqual([24, 24]);
    expect(fill(square, 0, 0)).toBe(colors[0]);
    expect(fill(square, 4, 0)).toBe('#000000');
    expect(fill(square, 5, 0)).toBe(colors[3]);
    expect(fill(square, 8, 0)).toBe(colors[0]);
    const other = model.pattern.types.find((t) => t.name !== 'square')!;
    applyPageColor(
      CallShape.parse({
        id: 'other',
        name: 'paint_pattern',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'Repaint other shapes',
          palette: null,
          colors: [{ typeId: other.name!, color: '#887766' }],
        },
      }),
      snapshot(),
      'request',
    );
    expect(history.now.squareBands?.sharedBorder).toBe(true);
    expect(
      placeFills(colouredModel(model, history.now), history.now)(square, 0, 0),
    ).toBe(colors[0]);
    expect(
      ColoringShape.parse(JSON.parse(JSON.stringify(history.now))),
    ).toEqual(history.now);
  });
  it('paints only the requested placement within the actual repeat, preserving all surrounding fills', () => {
    const before = placeFills(model, history.now);
    const command = CallShape.parse({
      id: 'place',
      name: 'paint_targets',
      arguments: {
        snapshotId: 's',
        documentRevision: 'r',
        label: 'One placement',
        scope: 'placement',
        targets: [{ targetId, color: '#ff1122' }],
      },
    });
    applyPageColor(command, snapshot(), 'request');
    const fill = placeFills(colouredModel(model, history.now), history.now);
    expect(fill(square, 0, 0)).toBe('#ff1122');
    for (let piece = 0; piece < model.pattern.pieces.length; piece++)
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 6; j++) {
          if (piece === square && i === 0 && j === 0) continue;
          expect(fill(piece, i, j)).toBe(before(piece, i, j));
        }
    expect(history.past).toHaveLength(1);
    expect(
      ColoringShape.parse(JSON.parse(JSON.stringify(history.now))),
    ).toEqual(history.now);
  });
  it('rejects a mixed valid and invalid target batch without applying any color', () => {
    const before = history.now;
    const command = CallShape.parse({
      id: 'bad',
      name: 'paint_targets',
      arguments: {
        snapshotId: 's',
        documentRevision: 'r',
        label: 'Invalid batch',
        scope: 'shape',
        targets: [
          { targetId, color: '#ff1122' },
          { targetId: 'geometry:piece999@0,0', color: '#123456' },
        ],
      },
    });
    expect(() => applyPageColor(command, snapshot(), 'request')).toThrow();
    expect(history.now).toBe(before);
    expect(history.past).toHaveLength(0);
  });
  it('changes coloring methods through normal history and repaints a rosette ring without changing other rings', () => {
    applyPageColor(
      CallShape.parse({
        id: 'method',
        name: 'set_coloring',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'Ring coloring',
          method: 'rings',
          rosettes: 1,
        },
      }),
      snapshot(),
      'request',
    );
    const rendered = colouredModel(model, history.now);
    const before = placeFills(rendered, history.now);
    const key = placeKey(rendered, square, 0, 0);
    applyPageColor(
      CallShape.parse({
        id: 'one',
        name: 'paint_targets',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'One position',
          scope: 'placement',
          targets: [{ targetId, color: '#112233' }],
        },
      }),
      snapshot(),
      'request',
    );

    applyPageColor(
      CallShape.parse({
        id: 'ring',
        name: 'paint_targets',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'One ring',
          scope: 'ring',
          targets: [{ targetId, color: '#887766' }],
        },
      }),
      snapshot(),
      'request',
    );
    const after = placeFills(rendered, history.now);
    for (let piece = 0; piece < model.pattern.pieces.length; piece++)
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          expect(after(piece, i, j)).toBe(
            placeKey(rendered, piece, i, j) === key
              ? '#887766'
              : before(piece, i, j),
          );
    expect(history.past).toHaveLength(3);
  });
  it('preserves earlier position colors when square bands enlarge the repeat, and lets manual shape paint replace them', () => {
    const piece = model.pattern.pieces.findIndex(
      (p) => model.pattern.types[p.type]?.name !== 'square',
    );
    const target = `geometry:piece${piece}@0,0`;
    const observed = snapshot();
    observed.targets.push({ id: target, kind: 'polygon', geometry: {} });
    applyPageColor(
      CallShape.parse({
        id: 'one',
        name: 'paint_targets',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'One non-square position',
          scope: 'placement',
          targets: [{ targetId: target, color: '#ff1122' }],
        },
      }),
      observed,
      'request',
    );
    const before = placeFills(colouredModel(model, history.now), history.now);
    applyPageColor(paint(), snapshot(), 'request');
    const rendered = colouredModel(model, history.now);
    const after = placeFills(rendered, history.now);
    for (let i = -12; i <= 12; i++)
      for (let j = -12; j <= 12; j++)
        expect(after(piece, i, j)).toBe(before(piece, i, j));
    const key = typeKey(
      model.pattern.types[model.pattern.pieces[piece]!.type]!,
    );
    const changed = {
      ...history.now,
      chosen: paintChosen(rendered, history.now, key, '#887766'),
    };
    const manual = placeFills(rendered, changed);
    expect(manual(piece, 0, 0)).toBe('#887766');
    expect(manual(piece, 6, 0)).toBe('#887766');
  });
});
