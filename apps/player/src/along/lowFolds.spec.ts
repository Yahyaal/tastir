import fixtures from '@tutorials/fixtures/low-folds.json';
import { classicSelection } from '@tastir/engine';
import { loadModel } from '../app/model';
import { tutorialColoring } from '../app/coloring';
import { placeFills } from '../app/placement';
import { rosetteCards } from '../app/rosettes';
import { foldOf, imagesOf, inkableOf } from '../editor/finish';
import { InkSession, readyOf, warmInk } from './inkWork';

describe.each(['pm', 'pmm', 'cmm'] as const)('%s in the player', (group) => {
  const model = loadModel((fixtures as Record<string, unknown>)[group]);

  it('keeps the wall fold when construction guides have more turns', () => {
    expect(foldOf(model.tutorial)).toBe(model.tutorial.fold);
  });

  it('inks exactly the allowed half-turns and mirrors', () => {
    const inkable = inkableOf(model.tutorial, model.scene);
    if (!inkable) throw new Error('No ink board');
    // General interior segments have two mirror images or four dihedral images.
    const orbit = {
      cell: inkable.cell,
      paths: new Map(),
      pieces: [1, -1].flatMap((x, i) =>
        [1, -1].map((y, j) => ({
          id: `${i}${j}`,
          segment: {
            kind: 'segment' as const,
            a: { x: x * 0.1, y: y * 0.1 },
            b: { x: x * 0.3, y: y * 0.2 },
          },
        })),
      ),
    };
    expect(imagesOf(orbit, '00', 1, false)).toEqual(['00']);
    expect(imagesOf(orbit, '00', 1, true)).toHaveLength(2);
    expect(imagesOf(orbit, '00', 2, false)).toHaveLength(2);
    expect(imagesOf(orbit, '00', 2, true)).toHaveLength(4);
    const classic = classicSelection(
      inkable.pieces,
      model.pattern.ink,
      model.scene.tol.eps,
      inkable.cell,
    );
    for (const id of classic)
      expect(
        imagesOf(inkable, id, model.tutorial.fold, true).every((copy) =>
          classic.has(copy),
        ),
      ).toBe(true);
  });

  it('prepares draw along and checks the learner ink against the tutorial', () => {
    const warm = warmInk(model);
    if ('reason' in warm) throw new Error(warm.reason);
    expect(warm.draft.fold).toBe(model.tutorial.fold);
    const session = new InkSession();
    const sent = session.prepare(model, warm.draft);
    if ('reason' in sent) throw new Error(sent.reason);
    const ready = readyOf(sent);
    expect(ready.classic.size).toBeGreaterThan(0);
    expect(
      session.check(sent.board, ready.classic, model.tutorial)?.matches,
    ).toBe(true);
  });

  it('colours every translated piece and offers complete ring cards', () => {
    const coloring = tutorialColoring(model);
    const fill = placeFills(model, coloring);
    for (let k = 0; k < model.pattern.pieces.length; k++)
      for (const i of [-1, 0, 1])
        for (const j of [-1, 0, 1])
          expect(fill(k, i, j)).toMatch(/^#|^rgb|^[a-z]/i);
    const cards = rosetteCards({
      ...model,
      tutorial: {
        ...model.tutorial,
        pattern: { ...model.tutorial.pattern, rings: true },
      },
    });
    expect(cards.flatMap((c) => c.rows).length).toBeGreaterThan(0);
  });
});
