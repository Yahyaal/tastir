import dadoJson from '@tutorials/alhambra-comares-dado.json';
import {
  DEFAULT_FINISH,
  finishOf,
  colorReducer,
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

  it('takes the grout and band colours the learner chose, one undo step each', () => {
    const start = { past: [], now: tutorialColoring(dado), future: [] };
    const band = colorReducer(start, { kind: 'finish', band: '#c4622d' });
    expect(band.past).toHaveLength(1);
    expect(finishOf(dado, band.now)).toEqual({
      lines: '#d9d2c4',
      band: '#c4622d',
      carved: false,
    });
    // A new palette keeps them: they are the wall's, not the pieces'.
    const palette = colorReducer(band, {
      kind: 'palette',
      palette: 'Alhambra',
    });
    expect(finishOf(dado, palette.now)).toEqual({
      ...DEFAULT_FINISH,
      band: '#c4622d',
    });
    expect(colorReducer(band, { kind: 'undo' }).now.finish).toBeUndefined();
  });
});
