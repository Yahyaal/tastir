import dadoJson from '@tutorials/alhambra-comares-dado.json';
import {
  colourDistance,
  DEFAULT_FINISH,
  groutFor,
  underBand,
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
    // Alhambra has a black piece, so its grout is not black (STYLE.8).
    expect(finishOf(dado, { palette: 'Alhambra', chosen: {} })).toEqual({
      ...DEFAULT_FINISH,
      grout: '#6b4a33',
    });
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
      grout: '#6b4a33',
      band: '#c4622d',
    });
    expect(colorReducer(band, { kind: 'undo' }).now.finish).toBeUndefined();
  });
});

describe('colours that would hide the lines', () => {
  it('moves the grout off a piece colour, and keeps it otherwise', () => {
    expect(groutFor(['#1d5c7c', '#f2ead8'], '#23201c')).toBe('#23201c');
    expect(groutFor(['#1a1a1a', '#f2ead8'], '#23201c')).toBe('#6b4a33');
  });

  it('tints a piece the colour of the band it lies under', () => {
    const colours = ['#f7f2e6', '#1d5c7c', '#c9a227'];
    expect(underBand('#1d5c7c', '#f7f2e6', colours)).toBe('#1d5c7c');
    const tinted = underBand('#f7f2e6', '#f7f2e6', colours);
    expect(tinted).not.toBe('#f7f2e6');
    expect(colourDistance(tinted, '#f7f2e6')).toBeGreaterThanOrEqual(48);
  });

  it('gives a piece a shade off the dark edge the edge colour', () => {
    const colours = ['#f7f2e6', '#1d1a18', '#2b4f8f'];
    // A near-black piece by the near-black edge: one black, not two.
    expect(underBand('#1d1a18', '#f7f2e6', colours, '#23201c')).toBe('#23201c');
    expect(underBand('#2b4f8f', '#f7f2e6', colours, '#23201c')).toBe('#2b4f8f');
  });
});
