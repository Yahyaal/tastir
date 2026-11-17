import { describe, expect, it } from 'vitest';
import { paletteNames, PAPER_PALETTES } from './coloring';
import { loadModel } from './model';
import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  historyOf,
  storedColours,
  styleColoursOf,
  styleColoursReducer,
} from './styleColours';

const model = loadModel(example);
const start = styleColoursOf({ palette: 'Fès tile', chosen: {} });
const palette = (name: string) => ({ kind: 'palette' as const, palette: name });

describe('each wall style keeps its own colours (STYLE.5)', () => {
  it('offers the paper palettes with watercolour only', () => {
    expect(paletteNames(model, true)).toEqual(PAPER_PALETTES);
    expect(paletteNames(model)).not.toContain('Rose');
    expect(paletteNames(model)).toContain('Fès tile');
  });

  it('carries glaze colours to an uncoloured glaze style', () => {
    const s = styleColoursReducer(start, {
      style: 'tiles',
      action: palette('Alhambra'),
    });
    expect(historyOf(s, 'interlace').now.palette).toBe('Alhambra');
  });

  it('keeps a style coloured on its own as it was', () => {
    let s = styleColoursReducer(start, {
      style: 'interlace',
      action: palette('Alhambra'),
    });
    s = styleColoursReducer(s, { style: 'tiles', action: palette('Kashan') });
    expect(historyOf(s, 'interlace').now.palette).toBe('Alhambra');
    expect(historyOf(s, 'tiles').now.palette).toBe('Kashan');
    // Undo in one style leaves the other alone.
    s = styleColoursReducer(s, { style: 'tiles', action: { kind: 'undo' } });
    expect(historyOf(s, 'interlace').now.palette).toBe('Alhambra');
  });

  it('opens watercolour in a paper palette until it is coloured', () => {
    expect(historyOf(start, 'lines').now.palette).toBe('Rose');
    const s = styleColoursReducer(start, {
      style: 'lines',
      action: palette('Teal and gold'),
    });
    expect(historyOf(s, 'lines').now.palette).toBe('Teal and gold');
    expect(historyOf(s, 'tiles').now.palette).toBe('Fès tile');
  });

  it('stores only the styles that differ, and opens them again', () => {
    expect(storedColours(start)).toEqual({
      coloring: { palette: 'Fès tile', chosen: {} },
    });
    let s = styleColoursReducer(start, {
      style: 'lines',
      action: palette('Teal and gold'),
    });
    s = styleColoursReducer(s, { style: 'tiles', action: palette('Kashan') });
    const stored = storedColours(s);
    expect(stored.coloring.palette).toBe('Kashan');
    expect(stored.colorings?.lines?.palette).toBe('Teal and gold');
    const again = styleColoursOf(stored.coloring, stored.colorings);
    expect(historyOf(again, 'lines').now.palette).toBe('Teal and gold');
    expect(historyOf(again, 'interlace').now.palette).toBe('Kashan');
  });
});
