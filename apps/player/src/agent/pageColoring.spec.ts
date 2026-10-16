import { encodeShared, decodeShared } from '../editor/files';
import { wallSvg } from '../app/exporting';
import tutorial from '@tutorials/alhambra-arrayanes-squares.json';
import unsupported from '@tutorials/eight-fold-star-and-cross.json';
import { SnapshotShape, type ToolCall } from '@tastir/agent-protocol';
import { ColoringShape, SharedDesignShape } from '@tastir/schema';
import { loadModel } from '../app/model';
import { colorReducer, tutorialColoring, type History } from '../app/coloring';
import { colouredModel, placeFills, colorRepeat } from '../app/placement';
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
    colors,
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
});
