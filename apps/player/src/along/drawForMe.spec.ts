import {
  cellOf,
  checkStep,
  classicSelection,
  computePattern,
  evaluate,
  expectedGolden,
  goldenOf,
  hiddenHelpers,
  inkPieces,
  strokesOf,
} from '@tastir/engine';
import { parseTutorial, type Tutorial } from '@tastir/schema';
import { emptyDraft, type Draft } from '../editor/document';
import { LIBRARY } from '../app/library';
import { shownBeats, withHelpers } from '../app/model';
import { asPanel, loadModel } from '../app/model';
import { check } from '../editor/document';
import { tutorialOf } from '../editor/finish';
import { drawForMe, withTutorialInk } from './drawForMe';
import { readyToInk, samePieces } from './inking';

const tutorialJson = LIBRARY.map((e) => e.json);
const tutorials = tutorialJson.map((j) => parseTutorial(j));

/**
 * Every shown step drawn for the learner, from an empty board; helper
 * lines are optional, and with `helpers` off the steps that draw only
 * hidden helper lines are skipped, as draw along does.
 */
export function drawnForMe(t: Tutorial, helpers = true): Draft {
  const scene = evaluate(t);
  const model = withHelpers(
    { tutorial: t, scene, pattern: computePattern(scene, t) },
    helpers,
  );
  const optional = hiddenHelpers(scene, t);
  const shapes = new Set([t.pattern.cell]);
  let draft = emptyDraft(`${t.id}-along`, t.title);
  for (const beat of shownBeats(model.tutorial)) {
    draft =
      drawForMe(t, scene, draft, beat, 'Drawn for me.', shapes, optional) ??
      draft;
    const board = evaluate({ steps: draft.steps } as Tutorial);
    expect(
      checkStep(scene, board, beat, undefined, shapes, optional).done,
      `${t.id} beat ${beat}`,
    ).toBe(true);
  }
  return draft;
}

describe('Draw it for me through every tutorial', () => {
  it('covers every library entry and every difficulty', () => {
    expect(tutorials).toHaveLength(LIBRARY.length);
    expect(new Set(tutorials.map((t) => t.level))).toEqual(
      new Set(['beginner', 'intermediate', 'advanced']),
    );
  });

  // Every step drawn for the learner, then the board inked as the tutorial
  // inks it: the pieces are the tutorial's expected pieces, both as the
  // draw-along page checks them (free ink on the board) and in the
  // pattern it keeps (the tutorial's ink taken onto the board).
  it.each(
    tutorialJson.flatMap((j) =>
      [true, false].map(
        (helpers) => [(j as { id: string }).id, helpers, j] as const,
      ),
    ),
  )('%s, helper lines shown: %s', (_, helpers, json) => {
    const t = parseTutorial(json);
    const scene = evaluate(t);
    const board = readyToInk(t, scene, drawnForMe(t, helpers));

    const bs = check(board).scene;
    const cell = cellOf(bs, board.pattern?.cell ?? '');
    const pieces = inkPieces(bs, cell, { allEdges: true });
    const inked = classicSelection(
      pieces,
      asPanel(loadModel(json)).pattern.ink,
      1e-7,
      cell,
    );
    const pattern = computePattern(
      bs,
      board as Tutorial,
      strokesOf(pieces, inked),
    );
    const free = pattern.types.map((p) => ({
      name: p.name ?? '',
      vertices: p.vertices,
      area: Number(p.area.toFixed(5)),
      perCell: p.perCell,
    }));
    expect(
      samePieces({ expect: { pieceTypes: free.length, pieces: free } }, t),
    ).toBe(true);

    const kept = tutorialOf(withTutorialInk(t, scene, board));
    if (!('tutorial' in kept)) throw new Error(kept.reason);
    const golden = expectedGolden(t);
    const got = expectedGolden(kept.tutorial);
    expect(got.pieceTypes).toBe(golden.pieceTypes);
    // Sorted, because two types of equal area may be found in either order.
    const sorted = (ps: typeof golden.pieces) =>
      [...ps].sort((x, y) => x.area - y.area || x.vertices - y.vertices);
    expect(sorted(got.pieces)).toEqual(sorted(golden.pieces));
  });

  it('draws a step on a board drawn another way', () => {
    const t = tutorials.find(
      (x) => x.id === 'eight-fold-star-and-cross',
    ) as Tutorial;
    const scene = evaluate(t);
    let draft = emptyDraft('along', t.title);
    for (const beat of [1, 2, 3])
      draft = drawForMe(t, scene, draft, beat, '') ?? draft;
    // The dynamic square as four ruled lines, not a polygon.
    draft = {
      ...draft,
      steps: [
        ...draft.steps,
        {
          id: draft.steps.length + 1,
          text: 'Four lines.',
          create: {
            S: { point: { meet: ['c', 'v'], pick: { angle: 270 } } },
            L1: { line: { through: ['A', 'N'] } },
            L2: { line: { through: ['N', 'W'] } },
            L3: { line: { through: ['W', 'S'] } },
            L4: { line: { through: ['S', 'A'] } },
          },
        },
      ],
    };
    const before = evaluate({ steps: draft.steps } as Tutorial);
    expect(checkStep(scene, before, 4).done).toBe(true);
    // Step 5 marks the crossings of the two squares, so the dynamic
    // square is drawn as a shape on the way.
    draft = drawForMe(t, scene, draft, 5, '') ?? draft;
    const after = evaluate({ steps: draft.steps } as Tutorial);
    expect(checkStep(scene, after, 5).done).toBe(true);
    expect(drawForMe(t, scene, draft, 5, '')).toBeUndefined();
  });

  it.each(LIBRARY.map((e) => [e.id, e.json] as const))(
    '%s: hiding helper lines changes no piece (golden values)',
    (_, json) => {
      const model = loadModel(json);
      const hidden = withHelpers(model, false);
      expect(goldenOf(hidden.tutorial)).toEqual(expectedGolden(model.tutorial));
    },
  );

  it('does not require a helper line nothing needs (Comares bones)', () => {
    const t = tutorials.find(
      (x) => x.id === 'alhambra-comares-bones',
    ) as Tutorial;
    const scene = evaluate(t);
    const hidden = hiddenHelpers(scene, t);
    const step = t.steps.find((s) =>
      Object.keys(s.create ?? {}).some((n) => hidden.has(n)),
    );
    if (!step) throw new Error('no hideable helper line');
    const beat = t.steps.indexOf(step) + 1;
    // The step drawn without its hideable helper lines (and without the
    // points they alone would find).
    const create = Object.fromEntries(
      Object.entries(step.create ?? {}).filter(
        ([n, el]) =>
          !hidden.has(n) &&
          !('point' in el && el.point.meet.some((m) => hidden.has(m))),
      ),
    );
    const before = t.steps.filter((s) => s.id < step.id);
    const board = evaluate({
      steps: [...before, { ...step, create }],
    } as Tutorial);
    const shapes = new Set([t.pattern.cell]);
    expect(checkStep(scene, board, beat, undefined, shapes, hidden).done).toBe(
      true,
    );
    // Without the option they would be missing.
    expect(checkStep(scene, board, beat, undefined, shapes).done).toBe(false);
  });
});
