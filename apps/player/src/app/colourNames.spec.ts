import { colourName } from './colourNames';

describe('colour names', () => {
  it('names glaze colours plainly', () => {
    expect(colourName('#ffffff')).toBe('white');
    expect(colourName('#1c1a17')).toBe('black');
    expect(colourName('#f4ede1')).toBe('cream');
    expect(colourName('#1e6b52')).toBe('green');
    expect(colourName('#1f4e8c')).toBe('blue');
    expect(colourName('#d49a2a')).toBe('saffron');
    expect(colourName('#b5502f')).toBe('terracotta');
    expect(colourName('#2a8c96')).toBe('turquoise');
    expect(colourName('#0d2a5e')).toBe('dark blue');
  });

  it('gives back what it cannot read', () => {
    expect(colourName('teal')).toBe('teal');
  });
});
