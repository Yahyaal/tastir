import latticeJson from '@tutorials/alhambra-comares-lattice.json';
import rosetteJson from '@tutorials/eight-fold-zellige.json';
import hexagonsJson from '@tutorials/six-fold-star-and-hexagons.json';
import {
  colorReducer,
  GLAZES,
  glazeOf,
  tutorialColoring,
  typeKey,
  type Coloring,
} from './coloring';
import { loadModel, type Model } from './model';
import { byPlace, colorRepeat, placeFills, placeKey } from './placement';
import { centreType, ringsOf } from './rings';

/** A tutorial coloured by rings, in a tradition's glazes. */
function byRings(json: unknown, rings: unknown = true): Model {
  const model = loadModel(json);
  return {
    ...model,
    tutorial: {
      ...model.tutorial,
      pattern: {
        ...model.tutorial.pattern,
        palette: 'Marinid zellige',
        rings: rings as true,
      },
    },
  };
}

const rosette = byRings(rosetteJson);
const glaze = GLAZES['Marinid zellige'];
const pieceOf = (model: Model, name: string) =>
  model.pattern.pieces.findIndex(
    (p) => model.pattern.types[p.type]?.name === name,
  );

describe('colouring by rings', () => {
  it('finds the rosette centre: the eight-pointed star, not the octagon round it', () => {
    const star = rosette.pattern.types.findIndex((t) => t.name === 'star');
    expect(centreType(rosette.pattern)).toBe(star);
  });

  it('lets neighbouring rosettes take turns, two families on a square lattice', () => {
    const rings = ringsOf(rosette.pattern);
    expect(rings?.repeat).toEqual([2, 2]);
    expect(rings?.rosettes).toBe(2);
    const star = pieceOf(rosette, 'star');
    const fill = placeFills(rosette, tutorialColoring(rosette));
    // The star is a spark of the other family's main colour.
    expect(fill(star, 0, 0)).not.toBe(fill(star, 1, 0));
    expect(fill(star, 0, 0)).toBe(fill(star, 1, 1));
    expect([glaze?.families[0]?.[0], glaze?.families[1]?.[0]]).toContain(
      fill(star, 0, 0),
    );
    // The repeat: two cells along is the same colour again.
    expect(fill(star, 2, 3)).toBe(fill(star, 0, 1));
    expect(colorRepeat(rosette)).toEqual([2, 2]);
  });

  it('takes three families on a hexagonal lattice, where three rosettes all touch', () => {
    const hexagons = byRings(hexagonsJson);
    const rings = ringsOf(hexagons.pattern);
    expect(rings?.repeat).toEqual([3, 3]);
    expect(rings?.families).toBe(3);
  });

  it('keeps two rings of one colour from touching', () => {
    const fill = placeFills(rosette, tutorialColoring(rosette));
    const plain = new Set([glaze?.white, glaze?.black]);
    const rings = ringsOf(rosette.pattern);
    const { cell, pieces } = rosette.pattern;
    const sides = new Map<string, { ring: string; colour: string }[]>();
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++)
        pieces.forEach((p, k) => {
          const d = {
            x: i * cell.u.x + j * cell.v.x,
            y: i * cell.u.y + j * cell.v.y,
          };
          const ps = p.polygon.map((q) => ({ x: q.x + d.x, y: q.y + d.y }));
          ps.forEach((q, e) => {
            const r = ps[(e + 1) % ps.length] ?? q;
            const a = `${q.x.toFixed(4)},${q.y.toFixed(4)}`;
            const b = `${r.x.toFixed(4)},${r.y.toFixed(4)}`;
            const side = a < b ? `${a}|${b}` : `${b}|${a}`;
            sides.set(side, [
              ...(sides.get(side) ?? []),
              {
                ring: rings?.place(k, i, j).ring ?? '',
                colour: fill(k, i, j),
              },
            ]);
          });
        });
    for (const [x, y] of sides.values()) {
      if (!x || !y || x.ring === y.ring || plain.has(x.colour)) continue;
      expect(x.colour).not.toBe(y.colour);
    }
  });

  it('takes a cross as the centre when no star turns more, as on Nasrid walls', () => {
    const lattice = byRings(latticeJson);
    expect(ringsOf(lattice.pattern)?.families).toBe(2);
    expect(byPlace(lattice)).toBe(true);
  });

  it('colours by shape when no piece turns into itself', () => {
    const scalene = {
      ...rosette.pattern,
      pieces: [
        {
          type: 0,
          polygon: [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 0, y: 1 },
          ],
        },
      ],
    };
    expect(centreType(scalene)).toBeUndefined();
    expect(ringsOf(scalene)).toBeUndefined();
  });

  it('follows the tutorial’s corrections, for a shape or one ring of it', () => {
    const star = pieceOf(rosette, 'star');
    const white = byRings(rosetteJson, { colors: { star: 'white' } });
    expect(placeFills(white, tutorialColoring(white))(star, 0, 0)).toBe(
      glaze?.white,
    );
    const black = byRings(rosetteJson, { colors: { 'star@1': 'black' } });
    expect(placeFills(black, tutorialColoring(black))(star, 1, 0)).toBe(
      glaze?.black,
    );
  });

  it('repaints a whole ring, and a shape painted drops its rings’ colours', () => {
    const star = pieceOf(rosette, 'star');
    const start: Coloring = tutorialColoring(rosette);
    const ring = placeKey(rosette, star, 0, 0);
    let h = colorReducer(
      { past: [], now: start, future: [] },
      { kind: 'paint', type: ring, color: '#ff0000' },
    );
    let fill = placeFills(rosette, h.now);
    expect(fill(star, 0, 0)).toBe('#ff0000');
    expect(fill(star, 1, 1)).toBe('#ff0000');
    expect(fill(star, 1, 0)).not.toBe('#ff0000');
    const t = rosette.pattern.types[rosette.pattern.pieces[star]?.type ?? 0];
    h = colorReducer(h, {
      kind: 'paint',
      type: typeKey(t as never),
      color: '#00ff00',
    });
    fill = placeFills(rosette, h.now);
    expect(fill(star, 0, 0)).toBe('#00ff00');
    expect(fill(star, 1, 0)).toBe('#00ff00');
  });

  it('gives an older palette glazes from its own colours', () => {
    const g = glazeOf('Fès tile');
    expect(g.white).toBe('#f2ead8');
    expect(g.families).toHaveLength(3);
  });
});

describe('filler stars', () => {
  it('gives the star between four Bou Inania rosettes rings of its own', async () => {
    const bou = (await import('@tutorials/bou-inania-rosette.json')).default;
    const rings = ringsOf(byRings(bou).pattern);
    expect(rings?.rosettes).toBe(2);
    // The rosettes' two families, and the fillers' own.
    expect(rings?.families).toBe(3);
  }, 30000);
});
