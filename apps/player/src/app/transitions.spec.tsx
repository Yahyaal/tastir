import { render } from '@testing-library/react';
import json from '@tutorials/six-fold-hammerhead.json';
import shiftedJson from '@tutorials/kurt-eight-fold-zellige-shifted.json';
import squareJson from '@tutorials/kurt-eight-fold-zellige.json';
import { rulerOrder } from './animation';
import mianJson from '@tutorials/twelve-fold-rosette-mian.json';
import { pieceColors } from './coloring';
import { Construction, RepeatedInk, rowBasis } from './drawing';
import { loadModel } from './model';
import { Wall } from './Wall';

const model = loadModel(json);
const steps = model.tutorial.steps.length;

describe('the move from the last step to the ink', () => {
  it('inks every line once, a ruler at a time, parallel lines together', () => {
    const order = rulerOrder(loadModel(mianJson));
    const m = loadModel(mianJson);
    const drawn = order.flatMap((r) => r.strokes.map((s) => s.index));
    expect([...drawn].sort((a, b) => a - b)).toEqual(
      m.pattern.ink.map((_, i) => i),
    );
    // Every stretch under one ruler lies on that ruler's line.
    for (const r of order) {
      const d = { x: r.to.x - r.from.x, y: r.to.y - r.from.y };
      const len = Math.hypot(d.x, d.y);
      for (const { index } of r.strokes) {
        for (const p of [
          m.pattern.ink[index]!.segment.a,
          m.pattern.ink[index]!.segment.b,
        ]) {
          const off = ((p.x - r.from.x) * d.y - (p.y - r.from.y) * d.x) / len;
          expect(Math.abs(off)).toBeLessThan(1e-6);
        }
      }
    }
    // Lines of one direction follow each other.
    const angles = order.map((r) => Math.round(r.angle));
    const seen = new Set<number>();
    angles.forEach((a, k) => {
      if (k > 0 && angles[k - 1] !== a) {
        expect(seen.has(a)).toBe(false);
      }
      seen.add(a);
    });
    // Her star lines (long, in pairs) come before the short outline stretches.
    expect(order[0]!.strokes.length).toBe(2);
    expect(order[1]!.parallelToPrevious).toBe(true);
  });

  it('plays only when asked', () => {
    const { container, rerender } = render(
      <Construction model={model} upTo={steps} ink enter />,
    );
    expect(container.querySelector('svg.ink-enter')).toBeTruthy();
    expect(container.querySelectorAll('[data-ruler]').length).toBeGreaterThan(
      0,
    );
    expect(container.querySelector('[data-tile]')).toBeTruthy();
    expect(container.querySelectorAll('[data-ink]')).toHaveLength(
      model.pattern.ink.length,
    );
    rerender(<Construction model={model} upTo={steps} ink />);
    expect(container.querySelector('svg.ink-enter')).toBeNull();
    expect(container.querySelector('[data-ruler]')).toBeNull();
  });
});

describe('the move to the repeat', () => {
  it('builds a row along the shortest repeat, with no shift on a square grid', () => {
    const { row, next } = rowBasis(loadModel(squareJson));
    expect(Math.abs(row.y)).toBeLessThan(1e-9);
    expect(Math.abs(next.x)).toBeLessThan(1e-9);
  });

  it('shifts each row along by half a step when the rows are shifted', () => {
    const { row, next } = rowBasis(loadModel(shiftedJson));
    const along = (next.x * row.x + next.y * row.y) / (row.x ** 2 + row.y ** 2);
    expect(Math.abs(along)).toBeCloseTo(0.5, 6);
  });

  it('marks each copy by its place in the row and its row', () => {
    const { container } = render(<RepeatedInk model={model} enter />);
    const original = container.querySelector('.ink.original');
    expect(original?.getAttribute('data-copy')).toBe('0,0');
    expect(container.querySelector('[data-copy="1,0"]')).toBeTruthy();
    expect(container.querySelector('[data-copy="0,1"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-copy] .copy-outline').length).toBe(
      container.querySelectorAll('[data-copy]').length,
    );
  });
});

describe('the move to colour', () => {
  it('veils the wall in white, one group for each piece type', () => {
    const { container } = render(
      <Wall model={model} colors={pieceColors(model)} enter />,
    );
    const groups = [...container.querySelectorAll<SVGGElement>('.veil-type')];
    expect(groups.map((g) => g.dataset['type'])).toEqual(
      model.pattern.types.map((_, i) => String(i)),
    );
    expect(groups.every((g) => g.querySelector('polygon'))).toBe(true);
  });

  it('has no veil without it', () => {
    const { container } = render(
      <Wall model={model} colors={pieceColors(model)} />,
    );
    expect(container.querySelector('.color-veil')).toBeNull();
  });
});
