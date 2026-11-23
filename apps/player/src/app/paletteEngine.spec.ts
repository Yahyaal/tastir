import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadModel, type Model } from './model';
import {
  colourDistance,
  finishOf,
  ORIGINAL,
  paletteOf,
  pieceColors,
  slotOf,
  touchingTypes,
  typeKey,
  type Coloring,
} from './coloring';
import {
  colorRepeat,
  colouredModel,
  placeFills,
  ruleFills,
} from './placement';

const load = (id: string): Model =>
  loadModel(
    JSON.parse(
      readFileSync(
        resolve(__dirname, `../../../../tutorials/${id}.json`),
        'utf8',
      ),
    ),
  );
const pairs = (m: Model) =>
  [...touchingTypes(m)].map(
    (k) => k.split(',').map(Number) as [number, number],
  );
const wish = (m: Model, palette: string) => {
  const p = paletteOf(m, palette);
  return m.pattern.types.map((t, i) => p[slotOf(m, t, i)]);
};

describe('the palette engine', () => {
  const ceiling = load('alhambra-arrayanes-porch-ceiling');

  it('gives no piece the colour of white bands, nor a grey (STYLE.4)', () => {
    for (const palette of ['Marinid zellige', 'Alhambra', 'Modern Moroccan']) {
      const coloring: Coloring = { palette, chosen: {} };
      const { band, lines } = finishOf(ceiling, coloring);
      const colours = pieceColors(ceiling, coloring, { band, edge: lines });
      for (const c of colours)
        expect(colourDistance(c, band)).toBeGreaterThanOrEqual(48);
      // Every colour is the palette's, its glaze's, or a shade of one: the
      // old re-tint made a grey no palette has.
      for (const [a, b] of pairs(ceiling))
        expect(colours[a]).not.toBe(colours[b]);
    }
  });

  it('never lets two touching shapes share a colour (STYLE.2)', () => {
    const wall = load('alhambra-dos-hermanas-band-stars');
    for (const palette of ['Marinid zellige', 'Fès tile', 'Chefchaouen']) {
      const colours = pieceColors(wall, { palette, chosen: {} });
      for (const [a, b] of pairs(wall))
        expect(
          colourDistance(colours[a] ?? '', colours[b] ?? ''),
        ).toBeGreaterThanOrEqual(48);
    }
  });

  it("keeps a tutorial's colours exactly when they break no rule", () => {
    const star = load('eight-fold-star-and-cross');
    for (const palette of ['Marinid zellige', 'Alhambra'])
      expect(pieceColors(star, { palette, chosen: {} })).toEqual(
        wish(star, palette),
      );
  });

  it('lets the small shapes give way, not the large ones', () => {
    const bands = load('abas-salman-232-star-bands');
    const colours = pieceColors(bands, {
      palette: 'Marinid zellige',
      chosen: {},
    });
    const wanted = wish(bands, 'Marinid zellige');
    const area = (i: number) => {
      const t = bands.pattern.types[i]!;
      return Math.abs(t.area) * t.perCell;
    };
    const largest = [...bands.pattern.types.keys()].sort(
      (x, y) => area(y) - area(x),
    )[0]!;
    expect(colours[largest]).toBe(wanted[largest]);
  });

  it("keeps the learner's colours and a photo's original as they are", () => {
    const t = ceiling.pattern.types[0]!;
    const coloring: Coloring = {
      palette: 'Marinid zellige',
      chosen: { [typeKey(t)]: '#ffffff' },
    };
    const { band, lines } = finishOf(ceiling, coloring);
    expect(pieceColors(ceiling, coloring, { band, edge: lines })[0]).toBe(
      '#ffffff',
    );
    const door = load('minbar-doors-cairo');
    const original: Coloring = { palette: ORIGINAL, chosen: {} };
    expect(pieceColors(door, original)).toEqual(wish(door, ORIGINAL));
  });

  it('is the same every time', () => {
    const coloring: Coloring = { palette: 'Timurid tile', chosen: {} };
    expect(pieceColors(ceiling, coloring)).toEqual(
      pieceColors(ceiling, coloring),
    );
  });

  it('keeps the rules on a wall coloured by place, as plain tiles', () => {
    const wall = load('alhambra-comares-west-dado');
    for (const palette of ['Marinid zellige', 'Alhambra', 'Modern Moroccan']) {
      const coloring: Coloring = { palette, chosen: {} };
      const model = colouredModel(wall, coloring);
      const rules = ruleFills(model, coloring);
      const fill = placeFills(model, coloring);
      const [m, n] = colorRepeat(model);
      for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
          model.pattern.pieces.forEach((_, k) =>
            expect(fill(k, i, j)).toBe(rules(k, i, j)),
          );
    }
  });
});
