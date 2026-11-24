import { describe, expect, it } from 'vitest';
import {
  deltaE,
  disharmony,
  lch,
  merges,
  oklab,
  solveColours,
  type ColourProblem,
} from './harmony.js';

describe('colour measures (OKLab)', () => {
  it('puts white at lightness 1 and black at 0, with no hue', () => {
    expect(oklab('#ffffff').L).toBeCloseTo(1, 3);
    expect(oklab('#000000').L).toBeCloseTo(0, 3);
    expect(lch('#808080').C).toBeLessThan(1e-3);
  });

  it('measures distance alike in either order, and zero for one colour', () => {
    expect(deltaE('#1f4e9c', '#1f4e9c')).toBe(0);
    expect(deltaE('#1f4e9c', '#e0a030')).toBeCloseTo(
      deltaE('#e0a030', '#1f4e9c'),
      12,
    );
    expect(deltaE('#000000', '#ffffff')).toBeCloseTo(1, 2);
  });

  it('reads close colours and two darks as one, and black by gold as two', () => {
    expect(merges('#1f4e9c', '#22509f')).toBe(true);
    expect(merges('#111111', '#1b2a4a')).toBe(true);
    expect(merges('#111111', '#e0a030')).toBe(false);
  });
});

describe('harmonic templates (Matsuda)', () => {
  const scheme = (...cs: [string, number][]) => new Map(cs);

  it('holds one hue, and neighbouring hues, in harmony', () => {
    expect(disharmony(scheme(['#1f4e9c', 0.5], ['#2a6fd0', 0.5]))).toBe(0);
  });

  it('ignores greys, which have no hue to clash', () => {
    expect(
      disharmony(scheme(['#1f4e9c', 0.4], ['#808080', 0.3], ['#ffffff', 0.3])),
    ).toBe(0);
  });

  it('fits an L scheme and its mirror alike', () => {
    // One hue, and a sector a quarter turn to either side of it.
    const hue = (h: number) => {
      // A strong colour of that OKLab hue, found by search.
      let best = '#000000';
      let gap = Infinity;
      for (let r = 0; r < 256; r += 17)
        for (let g = 0; g < 256; g += 17)
          for (let b = 0; b < 256; b += 17) {
            const c = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
            const x = lch(c);
            if (x.C < 0.1) continue;
            const d = Math.abs(((x.h - h + 540) % 360) - 180);
            if (d < gap) {
              gap = d;
              best = c;
            }
          }
      return best;
    };
    const left = disharmony(scheme([hue(30), 0.5], [hue(120), 0.5]), 1);
    const right = disharmony(scheme([hue(30), 0.5], [hue(300), 0.5]), 1);
    expect(left).toBeLessThan(0.01);
    expect(right).toBeLessThan(0.01);
  });
});

describe('the search', () => {
  const problem = (over: Partial<ColourProblem>): ColourProblem => ({
    wish: [],
    share: [],
    pairs: [],
    locked: [],
    palette: ['#1f4e9c', '#e0a030', '#111111', '#f4ead8', '#2f8a57'],
    ...over,
  });

  it('keeps the wish where no rule breaks', () => {
    const p = problem({
      wish: ['#1f4e9c', '#e0a030'],
      share: [0.5, 0.5],
      pairs: [[0, 1, 1]],
      locked: [false, false],
    });
    expect(solveColours(p)).toEqual(['#1f4e9c', '#e0a030']);
  });

  it('moves the smaller of two touching parts in one colour', () => {
    const out = solveColours(
      problem({
        wish: ['#1f4e9c', '#1f4e9c'],
        share: [0.8, 0.2],
        pairs: [[0, 1, 1]],
        locked: [false, false],
      }),
    );
    expect(out[0]).toBe('#1f4e9c');
    expect(out[1]).not.toBe('#1f4e9c');
    expect(merges(out[0]!, out[1]!)).toBe(false);
  });

  it('never moves a locked part, even when it breaks a rule', () => {
    const out = solveColours(
      problem({
        wish: ['#1f4e9c', '#1f4e9c'],
        share: [0.2, 0.8],
        pairs: [[0, 1, 1]],
        locked: [true, false],
      }),
    );
    expect(out[0]).toBe('#1f4e9c');
    expect(out[1]).not.toBe('#1f4e9c');
  });

  it('keeps clear of a colour that hides the bands', () => {
    const out = solveColours(
      problem({
        wish: ['#f4ead8', '#1f4e9c'],
        share: [0.6, 0.4],
        pairs: [[0, 1, 1]],
        locked: [false, false],
        hides: (c) => deltaE(c, '#f4ead8') < 0.15,
      }),
    );
    expect(deltaE(out[0]!, '#f4ead8')).toBeGreaterThanOrEqual(0.15);
  });

  it('gives the same answer every time', () => {
    const p = problem({
      wish: ['#1f4e9c', '#1f4e9c', '#e0a030'],
      share: [0.3, 0.3, 0.4],
      pairs: [
        [0, 1, 1],
        [1, 2, 1],
      ],
      locked: [false, false, false],
    });
    expect(solveColours(p)).toEqual(solveColours(p));
  });
});
