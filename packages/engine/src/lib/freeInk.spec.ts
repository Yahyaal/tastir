import { loadTutorial, tutorialFiles } from '../test/tutorials.js';
import { evaluate } from './evaluate.js';
import { classicSelection, inkPieces, strokesOf } from './freeInk.js';
import { cellOf, computePattern, type Pattern } from './pieces.js';

/** The piece types, rounded, for comparing two patterns. */
const shapes = (p: Pattern) =>
  p.types.map((t) => ({
    vertices: t.vertices,
    area: Number(t.area.toFixed(5)),
    perCell: t.perCell,
  }));

describe.each(tutorialFiles())('free inking %s', (file) => {
  const tutorial = loadTutorial(file);
  const scene = evaluate(tutorial);
  const cell = cellOf(scene, tutorial.pattern.cell);
  const classic = computePattern(scene, tutorial);
  const pieces = inkPieces(scene, cell);
  const chosen = classicSelection(pieces, classic.ink, scene.tol.eps);

  it('splits the construction inside the tile into separate pieces', () => {
    expect(pieces.length).toBeGreaterThan(classic.ink.length);
    expect(new Set(pieces.map((p) => p.id)).size).toBe(pieces.length);
  });

  it('gives the same pieces as the ink paths when the classic is picked piece by piece', () => {
    const picked = computePattern(scene, tutorial, strokesOf(pieces, chosen));
    expect(shapes(picked)).toEqual(shapes(classic));
  });

  it('changes the pieces when one inked piece is erased', () => {
    const fewer = new Set(chosen);
    fewer.delete([...chosen][0] as string);
    const changed = computePattern(scene, tutorial, strokesOf(pieces, fewer));
    expect(shapes(changed)).not.toEqual(shapes(classic));
  });
});

it('picks out exactly the star outline of the star and cross', () => {
  const tutorial = loadTutorial('eight-fold-star-and-cross.json');
  const scene = evaluate(tutorial);
  const pieces = inkPieces(scene, cellOf(scene, tutorial.pattern.cell));
  const chosen = classicSelection(
    pieces,
    computePattern(scene, tutorial).ink,
    scene.tol.eps,
  );
  // Sixteen strokes; none crosses another construction line on the way.
  expect(chosen.size).toBe(16);
});
