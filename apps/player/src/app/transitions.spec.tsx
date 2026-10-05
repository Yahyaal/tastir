import { render } from '@testing-library/react';
import json from '@tutorials/six-fold-hammerhead.json';
import shiftedJson from '@tutorials/kurt-eight-fold-zellige-shifted.json';
import squareJson from '@tutorials/kurt-eight-fold-zellige.json';
import { penOrder } from './animation';
import { pieceColors } from './coloring';
import { Construction, RepeatedInk, rowBasis } from './drawing';
import { loadModel } from './model';
import { Wall } from './Wall';

const model = loadModel(json);
const steps = model.tutorial.steps.length;

describe('the move from the last step to the ink', () => {
  it('inks every line once, path by path, starting nearest the centre', () => {
    const order = penOrder(model);
    const drawn = order.flat().map((s) => s.index);
    expect([...drawn].sort((a, b) => a - b)).toEqual(
      model.pattern.ink.map((_, i) => i),
    );
    const start = (s: { index: number; reversed: boolean }) => {
      const seg = model.pattern.ink[s.index]!.segment;
      const p = s.reversed ? seg.b : seg.a;
      return Math.hypot(p.x, p.y);
    };
    const firsts = order.map((path) => start(path[0]!));
    expect(firsts[0]).toBe(Math.min(...firsts));
  });

  it('plays only when asked', () => {
    const { container, rerender } = render(
      <Construction model={model} upTo={steps} ink enter />,
    );
    expect(container.querySelector('svg.ink-enter')).toBeTruthy();
    expect(container.querySelectorAll('[data-ink]')).toHaveLength(
      model.pattern.ink.length,
    );
    rerender(<Construction model={model} upTo={steps} ink />);
    expect(container.querySelector('svg.ink-enter')).toBeNull();
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
