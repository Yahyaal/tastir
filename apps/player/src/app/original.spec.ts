import dadoJson from '@tutorials/alhambra-comares-dado.json';
import {
  DEFAULT_FINISH,
  finishOf,
  ORIGINAL,
  paletteNames,
  paletteOf,
  pieceColors,
  tutorialColoring,
} from './coloring';
import { loadModel } from './model';

/** The dado with an original look, as picked from its photo. */
const original = {
  palette: {
    a: '#1c1a19',
    b: '#7a5a34',
    c: '#a07a48',
    d: '#3f5f8a',
    ground: '#e8ddd2',
  },
  lines: '#d9d2c4',
  carved: false,
};
const json = dadoJson as { pattern: Record<string, unknown> };
const dado = loadModel({
  ...json,
  pattern: { ...json.pattern, original },
});
const plain = loadModel(dadoJson);

describe('the original look', () => {
  it('opens in the original, offered first among the palettes', () => {
    expect(tutorialColoring(dado).palette).toBe(ORIGINAL);
    expect(paletteNames(dado)[0]).toBe(ORIGINAL);
    expect(paletteNames(plain)).not.toContain(ORIGINAL);
    expect(paletteOf(dado, ORIGINAL)).toEqual(original.palette);
  });

  it('colours the pieces from the photo’s palette', () => {
    const colors = pieceColors(dado);
    for (const c of colors)
      expect(Object.values(original.palette)).toContain(c);
  });

  it('draws the lines in the original’s colour, and the presets as tile', () => {
    expect(finishOf(dado, tutorialColoring(dado))).toEqual({
      lines: '#d9d2c4',
      band: DEFAULT_FINISH.band,
      carved: false,
    });
    expect(finishOf(dado, { palette: 'Alhambra', chosen: {} })).toBe(
      DEFAULT_FINISH,
    );
  });
});
