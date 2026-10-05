import { render } from '@testing-library/react';
import json from '@tutorials/six-fold-hammerhead.json';
import { pieceColors } from './coloring';
import { Construction, inkDelays, RepeatedInk } from './drawing';
import { loadModel } from './model';
import { Wall } from './Wall';

const model = loadModel(json);
const steps = model.tutorial.steps.length;

describe('the move from the last step to the ink', () => {
  it('draws the ink from the centre of the tile outwards', () => {
    const delays = inkDelays(model);
    const dist = model.pattern.ink.map(({ segment: s }) =>
      Math.hypot((s.a.x + s.b.x) / 2, (s.a.y + s.b.y) / 2),
    );
    const near = dist.indexOf(Math.min(...dist));
    const far = dist.indexOf(Math.max(...dist));
    expect(delays[near]).toBeLessThan(delays[far] as number);
  });

  it('plays only when asked', () => {
    const { container, rerender } = render(
      <Construction model={model} upTo={steps} ink enter />,
    );
    expect(container.querySelector('svg.ink-enter')).toBeTruthy();
    const line = container.querySelector('.ink line') as SVGLineElement;
    expect(line.style.getPropertyValue('--delay')).toMatch(/s$/);
    rerender(<Construction model={model} upTo={steps} ink />);
    expect(container.querySelector('svg.ink-enter')).toBeNull();
  });
});

describe('the move to the repeat', () => {
  it('pulls back from the tile while the copies arrive, nearest first', () => {
    const { container } = render(<RepeatedInk model={model} enter />);
    expect(
      container.querySelector('animate[attributeName="viewBox"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('.ink.original')?.getAttribute('style'),
    ).toBeNull();
    const delays = [
      ...container.querySelectorAll<SVGGElement>('.ink.copy'),
    ].map((g) => parseFloat(g.style.getPropertyValue('--delay')));
    expect(Math.min(...delays)).toBeLessThan(Math.max(...delays));
  });

  it('shows the wall at once without it', () => {
    const { container } = render(<RepeatedInk model={model} />);
    expect(container.querySelector('animate')).toBeNull();
  });
});

describe('the move to colour', () => {
  it('veils the wall in white, one piece type at a time', () => {
    const { container } = render(
      <Wall model={model} colors={pieceColors(model)} enter />,
    );
    const groups = [...container.querySelectorAll<SVGGElement>('.veil-type')];
    expect(groups.map((g) => g.style.getPropertyValue('--type'))).toEqual(
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
