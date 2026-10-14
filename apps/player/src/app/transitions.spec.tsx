import { render } from '@testing-library/react';
import json from '@tutorials/six-fold-hammerhead.json';
import shiftedJson from '@tutorials/kurt-eight-fold-zellige-shifted.json';
import squareJson from '@tutorials/kurt-eight-fold-zellige.json';
import filledJson from '@tutorials/kurt-eight-fold-zellige-filled.json';
import starJson from '@tutorials/eight-fold-star-and-cross.json';
import bouJson from '@tutorials/bou-inania-rosette.json';
import { rulerOrder } from './animation';
import mianJson from '@tutorials/twelve-fold-rosette-mian.json';
import { pieceColors } from './coloring';
import { Construction, RepeatedInk, rowBasis } from './drawing';
import { loadModel } from './model';
import { fillDelays, Wall } from './Wall';

const model = loadModel(json);
const steps = model.tutorial.steps.length;

describe('the move from the last step to the ink', () => {
  it('inks every line once, a ruler at a time, from the centre outward', () => {
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
    // Out from the centre: each ruler's ink comes no nearer the centre than
    // the one before, and each line is drawn from its end nearer the centre.
    const near = (r: (typeof order)[number]) => {
      const d = { x: r.to.x - r.from.x, y: r.to.y - r.from.y };
      const len = Math.hypot(d.x, d.y);
      return Math.abs((r.from.x * d.y - r.from.y * d.x) / len);
    };
    const reach = order.map((r) => {
      const ps = r.strokes.flatMap(({ index }) => [
        m.pattern.ink[index]!.segment.a,
        m.pattern.ink[index]!.segment.b,
      ]);
      return Math.min(...ps.map((p) => Math.hypot(p.x, p.y)), Infinity);
    });
    for (let k = 1; k < order.length; k++) {
      expect(Math.min(reach[k]!, near(order[k]!))).toBeGreaterThan(
        Math.min(reach[k - 1]!, near(order[k - 1]!)) - 1e-6,
      );
    }
    for (const r of order) {
      expect(Math.hypot(r.from.x, r.from.y)).toBeLessThanOrEqual(
        Math.hypot(r.to.x, r.to.y) + 1e-9,
      );
    }
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

  it('keeps the repeat running through unrelated parent renders', () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation);
    const original = Element.prototype.animate;
    Element.prototype.animate = animate;
    try {
      const m = loadModel(filledJson);
      const { rerender, unmount } = render(<RepeatedInk model={m} enter />);
      const started = animate.mock.calls.length;
      expect(started).toBeGreaterThan(0);
      rerender(<RepeatedInk model={m} enter />);
      expect(animate).toHaveBeenCalledTimes(started);
      expect(cancel).not.toHaveBeenCalled();
      unmount();
      expect(cancel).toHaveBeenCalledTimes(started);
    } finally {
      Element.prototype.animate = original;
    }
  });

  it('moves each later row once while preserving every copy position', () => {
    const m = loadModel(filledJson);
    const { row, next } = rowBasis(m);
    const { container } = render(<RepeatedInk model={m} enter />);
    const copies = [...container.querySelectorAll<SVGGElement>('[data-copy]')];
    const slides = [...container.querySelectorAll('[data-slide]')];
    expect(slides.length).toBeLessThan(copies.length / 2);
    expect(container.querySelectorAll('polygon.copy-outline')).toHaveLength(1);
    const translate = (el: Element) => {
      const [x, y] = (el.getAttribute('transform') ?? '')
        .slice(10, -1)
        .split(' ')
        .map(Number);
      return { x: x ?? 0, y: y ?? 0 };
    };
    for (const copy of copies) {
      const [i = 0, j = 0] = (copy.dataset['copy'] ?? '')
        .split(',')
        .map(Number);
      const local = translate(copy);
      const parent = translate(copy.parentElement!);
      expect(local.x + parent.x).toBeCloseTo(i * row.x + j * next.x, 9);
      expect(local.y + parent.y).toBeCloseTo(-i * row.y - j * next.y, 9);
    }
  });

  it('marks each copy by its place in the row and its row', () => {
    const { container } = render(<RepeatedInk model={model} enter />);
    const original = container.querySelector('.ink.original');
    expect(original?.getAttribute('data-copy')).toBe('0,0');
    expect(container.querySelector('[data-copy="1,0"]')).toBeTruthy();
    expect(container.querySelector('[data-copy="0,1"]')).toBeTruthy();
    expect(
      container.querySelectorAll('[data-copy] .copy-outline-instance').length,
    ).toBe(container.querySelectorAll('[data-copy]').length);
  });
});

describe('the move to colour', () => {
  it('colours the wall’s own pieces ring by ring, from the centres out', () => {
    const m = loadModel(starJson);
    const { container } = render(
      <Wall model={m} colors={pieceColors(m)} enter />,
    );
    // No cover over the wall: the pieces themselves take their colour.
    expect(container.querySelector('canvas')).toBeNull();
    const pieces = [
      ...container.querySelectorAll<SVGPolygonElement>(
        'pattern polygon.wall-piece',
      ),
    ];
    expect(pieces.length).toBeGreaterThan(0);
    const delayOf = (type: string) =>
      new Set(
        pieces
          .filter((p) => m.pattern.types[Number(p.dataset.type)]?.name === type)
          .map((p) => Number(p.dataset.delay)),
      );
    // Every star at once, first; every cross after them, together.
    expect([...delayOf('star')]).toEqual([0]);
    const cross = [...delayOf('cross')];
    expect(cross).toHaveLength(1);
    expect(cross[0]).toBeGreaterThan(0);
    expect(pieces[0]?.style.animationDelay).toMatch(/ms$/);
  });

  it('orders Bou Inania’s rings from the middle of each rosette outward', () => {
    const m = loadModel(bouJson);
    const delays = fillDelays(m.pattern);
    const rings = [...new Set(delays)];
    expect(rings.length).toBeGreaterThan(5);
    // The pieces round the middle come first, and the whole move stays short.
    expect(Math.min(...delays)).toBe(0);
    expect(Math.max(...delays)).toBeLessThanOrEqual(3600);
  });

  it('shows the finished colours at once without it', () => {
    const { container } = render(
      <Wall model={model} colors={pieceColors(model)} />,
    );
    const piece = container.querySelector<SVGPolygonElement>('.wall-piece');
    expect(piece?.dataset.delay).toBeUndefined();
    expect(piece?.style.animationDelay).toBe('');
  });
});
