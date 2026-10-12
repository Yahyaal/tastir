import { render } from '@testing-library/react';
import bonesJson from '@tutorials/alhambra-comares-bones.json';
import starsJson from '@tutorials/alhambra-infantas-stars.json';
import hammerJson from '@tutorials/six-fold-hammerhead.json';
import { colorReducer, PALETTES, tutorialColoring, typeKey } from './coloring';
import { loadModel } from './model';
import { colorRepeat, nthOf, placeFills, placeKey, turnOf } from './placement';
import { Wall } from './Wall';

/** A tutorial file as plain JSON. */
type Loose = { pattern: Record<string, unknown> };

const bones = loadModel(bonesJson);
const alhambra = PALETTES['Alhambra'] as Record<string, string>;

describe('colors by placement', () => {
  it('finds a long axis, and none for a square', () => {
    const bar = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(turnOf(bar)).toBeCloseTo(0, 6);
    expect(turnOf(bar.map((p) => ({ x: p.y, y: p.x })))).toBeCloseTo(90, 6);
    expect(
      turnOf([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]),
    ).toBeUndefined();
  });

  it('colors the Comares bones as the photo: white across, black or colored up', () => {
    const fill = placeFills(bones, tutorialColoring(bones));
    const turns = bones.pattern.pieces.map((p) => turnOf(p.polygon));
    const across = turns.findIndex((t) => t !== undefined && Math.abs(t) < 3);
    const up = turns.findIndex((t) => t !== undefined && Math.abs(t - 90) < 3);
    expect(colorRepeat(bones)).toEqual([2, 2]);
    for (const [i, j] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const)
      expect(fill(across, i, j)).toBe(alhambra['ground']);
    expect(fill(up, 0, 0)).toBe(alhambra['a']);
    expect(fill(up, 1, 1)).toBe(alhambra['a']);
    expect(fill(up, 1, 0)).toBe(alhambra['c']);
    expect(fill(up, 0, 1)).toBe(alhambra['b']);
    // The repeat: two cells along is the same color again.
    expect(fill(up, 2, 3)).toBe(fill(up, 0, 1));
  });

  it('gives the four Infantas stars of a cell four different colors', () => {
    const stars = loadModel(starsJson);
    expect([...nthOf(stars)].sort()).toEqual([0, 1, 2, 3]);
    const fill = placeFills(stars, tutorialColoring(stars));
    const colors = stars.pattern.pieces.map((_, k) => fill(k, 0, 0));
    expect(new Set(colors).size).toBe(4);
  });

  it('paints one placement, or the whole shape and drops placement choices', () => {
    const start = { past: [], now: tutorialColoring(bones), future: [] };
    const key = placeKey(bones, 0, 0, 0);
    const one = colorReducer(start, {
      kind: 'paint',
      type: key,
      color: '#ff0000',
    });
    let fill = placeFills(bones, one.now);
    expect(fill(0, 0, 0)).toBe('#ff0000');
    const t = bones.pattern.types[0]!;
    const all = colorReducer(one, {
      kind: 'paint',
      type: typeKey(t),
      color: '#00ff00',
    });
    expect(Object.keys(all.now.chosen)).toEqual([typeKey(t)]);
    fill = placeFills(bones, all.now);
    expect(fill(0, 0, 0)).toBe('#00ff00');
    expect(fill(1, 1, 0)).toBe('#00ff00');
  });

  it('keeps one color per shape when the tutorial has no placements or rings', () => {
    const { rings: _rings, ...byShape } = (hammerJson as Loose).pattern;
    const m = loadModel({ ...(hammerJson as Loose), pattern: byShape });
    expect(colorRepeat(m)).toEqual([1, 1]);
    expect(placeKey(m, 0, 3, 5)).toBe(
      typeKey(m.pattern.types[m.pattern.pieces[0]!.type]!),
    );
  });

  it('fills the wall by placement', () => {
    const fill = placeFills(bones, tutorialColoring(bones));
    const { container } = render(
      <Wall
        model={bones}
        colors={[]}
        fill={fill}
        repeat={colorRepeat(bones)}
      />,
    );
    const fills = new Set(
      [...container.querySelectorAll('pattern polygon')].map((p) =>
        p.getAttribute('fill'),
      ),
    );
    expect(fills).toEqual(
      new Set([
        alhambra['ground'],
        alhambra['a'],
        alhambra['b'],
        alhambra['c'],
      ]),
    );
  });
});
