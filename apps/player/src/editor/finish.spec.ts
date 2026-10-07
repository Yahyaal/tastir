import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  classicSelection,
  computePattern,
  evaluate,
  expectedGolden,
  goldenOf,
  hasSymmetry,
} from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { addStep, check, copyUpTo, type Draft } from './document';
import {
  imagesOf,
  inkableOf,
  inkedNow,
  tileOf,
  tutorialOf,
  withInk,
  withTile,
  type Inkable,
} from './finish';

const star = parseTutorial(example);

/** Shapes of a pattern's pieces: corners, area and how many per tile. */
const shapes = (
  types: readonly { vertices: number; area: number; perCell: number }[],
) => types.map((t) => [t.vertices, t.area.toFixed(5), t.perCell]);

function inkableFor(draft: Draft): Inkable {
  const found = inkableOf(draft, check(draft).scene);
  if (!found) throw new Error('no tile');
  return found;
}

describe('finishing a pattern', () => {
  it('writes the star and cross’s ink back as paths along its lines', () => {
    const draft = withTile(copyUpTo(star, 6), 'cell');
    const inkable = inkableFor(draft);
    const scene = check(draft).scene;
    // The classic ink, piece by piece, as free inking would pick it.
    const classic = classicSelection(
      inkable.pieces,
      computePattern(evaluate(star), star).ink,
      scene.tol.eps,
      inkable.cell,
    );
    expect(classic.size).toBe(16);
    const inked = withInk(draft, inkable, classic);
    expect(inked.ink?.paths.every((p) => 'along' in p)).toBe(true);
    // Read back, the ink covers the same pieces.
    expect(inkedNow(inked, scene, inkable)).toEqual(classic);
    const made = tutorialOf(inked);
    if (!('tutorial' in made)) throw new Error(made.reason);
    const pattern = computePattern(evaluate(made.tutorial), made.tutorial);
    expect(shapes(pattern.types)).toEqual(
      shapes(computePattern(evaluate(star), star).types),
    );
    // The file passes the golden test, like a library tutorial.
    expect(goldenOf(made.tutorial)).toEqual(expectedGolden(made.tutorial));
    expect(hasSymmetry(pattern, 8)).toBe(true);
  });

  it('toggles a piece with its turned and mirrored copies', () => {
    const inkable = inkableFor(withTile(copyUpTo(star, 6), 'cell'));
    const scene = check(withTile(copyUpTo(star, 6), 'cell')).scene;
    const classic = classicSelection(
      inkable.pieces,
      computePattern(evaluate(star), star).ink,
      scene.tol.eps,
      inkable.cell,
    );
    const one = [...classic][0] as string;
    const images = imagesOf(inkable, one, 8, true);
    // The star's 16 strokes are one piece turned and mirrored.
    expect(new Set(images)).toEqual(classic);
    expect(imagesOf(inkable, one, 8, false).length).toBe(8);
  });

  it('says what is missing before it can be played', () => {
    const draft = copyUpTo(star, 6);
    expect(tutorialOf(draft)).toEqual({
      reason: 'Choose the tile first, with the Tile tool.',
    });
    expect(tutorialOf(withTile(draft, 'cell'))).toEqual({
      reason: 'Ink the pattern first: click the lines to keep.',
    });
    expect(tileOf(withTile(draft, 'static'), check(draft).scene)).toEqual({
      cell: expect.anything(),
    });
    expect('reason' in tileOf(withTile(draft, 'k'), check(draft).scene)).toBe(
      true,
    );
  });

  it('makes the octagon and star from the plan, from step 3 of the star and cross', () => {
    // Steps 1–3 kept: the circle, the lines and the diagonals with their
    // eight points on the circle.
    let d = copyUpTo(star, 3);
    // The octagon through the eight points, and the eight-pointed star
    // joining every third one.
    const ring = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
    d = addStep(d, {
      text: 'The octagon.',
      create: { oct: { polygon: ring } },
    });
    d = addStep(d, {
      text: 'The star.',
      create: {
        st: { polygon: [0, 3, 6, 1, 4, 7, 2, 5].map((i) => ring[i] as string) },
      },
    });
    // The square tile round the circle, from the lines touching it.
    d = addStep(d, {
      text: 'The tile.',
      create: {
        tE: { line: { through: 'E', perpendicularTo: 'h' } },
        tW: { line: { through: 'W', perpendicularTo: 'h' } },
        tN: { line: { through: 'N', perpendicularTo: 'v' } },
        tS: { line: { through: 'S', perpendicularTo: 'v' } },
        c1: { point: { meet: ['tE', 'tN'] } },
        c2: { point: { meet: ['tN', 'tW'] } },
        c3: { point: { meet: ['tW', 'tS'] } },
        c4: { point: { meet: ['tS', 'tE'] } },
        tile: { polygon: ['c1', 'c2', 'c3', 'c4'] },
      },
    });
    d = withTile(d, 'tile');
    const inkable = inkableFor(d);
    // Ink the star and the octagon: every bit of line along them.
    const chosen = new Set(
      inkable.pieces
        .filter((p) =>
          ['st', 'oct'].includes(inkable.paths.get(p.id)?.along ?? ''),
        )
        .map((p) => p.id),
    );
    // Symmetry: inking one bit inks its turned and mirrored copies, which
    // are all on the star or the octagon too.
    const one = [...chosen][0] as string;
    for (const id of imagesOf(inkable, one, 8, true))
      expect(chosen.has(id)).toBe(true);
    const made = tutorialOf(withInk(d, inkable, chosen));
    if (!('tutorial' in made)) throw new Error(made.reason);
    const pattern = computePattern(evaluate(made.tutorial), made.tutorial);
    expect(pattern.types.length).toBeGreaterThan(0);
    expect(goldenOf(made.tutorial)).toEqual(expectedGolden(made.tutorial));
    expect(hasSymmetry(pattern, 8)).toBe(true);
  });
});
