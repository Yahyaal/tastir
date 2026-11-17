import { describe, expect, it } from 'vitest';
import { pieceDetail, pieceName } from './pieceNames';

describe('piece names as a learner reads them', () => {
  it('turns the tutorial ids into plain words', () => {
    expect(pieceName({ name: 'pointed_star', vertices: 16 })).toBe(
      'pointed star',
    );
    expect(pieceName({ name: 'long_hexagon', vertices: 6 })).toBe(
      'long hexagon',
    );
    expect(pieceName({ name: 'twelve', vertices: 12 })).toBe(
      'twelve-sided piece',
    );
    expect(pieceName({ name: 'small_eight', vertices: 8 })).toBe(
      'small eight-sided piece',
    );
    expect(pieceName({ name: 'ground', vertices: 48 })).toBe('background');
    expect(pieceName({ name: 'star', vertices: 16 })).toBe('star');
    expect(pieceName({ vertices: 4 })).toBe('4-corner piece');
  });

  it('counts a star by its points and other pieces by their corners', () => {
    expect(pieceDetail({ name: 'star', vertices: 16, perCell: 8 })).toBe(
      '8 points · 8 per tile',
    );
    expect(pieceDetail({ name: 'twelve', vertices: 12, perCell: 8 })).toBe(
      '12 corners · 8 per tile',
    );
  });
});
