import { act, fireEvent, render, screen } from '@testing-library/react';
import bou from '@tutorials/bou-inania-rosette.json';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Play } from './app';
import {
  centreOf,
  drawingBox,
  fit,
  fullView,
  height,
  MIN_FRAME,
  growingFrame,
  MIN_GROWING,
  stepFrame,
  width,
  zoomAt,
  type Rect,
} from './camera';
import { loadModel } from './model';

const model = loadModel(example);
const contains = (outer: Rect, inner: Rect) =>
  outer.minX <= inner.minX &&
  outer.minY <= inner.minY &&
  outer.maxX >= inner.maxX &&
  outer.maxY >= inner.maxY;
/** Where a point sits within a view, as shares of its width and height. */
const share = (view: Rect, p: { x: number; y: number }) => [
  (p.x - view.minX) / width(view),
  (p.y - view.minY) / height(view),
];

describe('the view maths', () => {
  it('keeps the point under the pointer still when zooming', () => {
    const view = { minX: -2, minY: -1, maxX: 2, maxY: 3 };
    const at = { x: 0.7, y: 2.1 };
    const zoomed = zoomAt(view, at, 2.5);
    expect(width(zoomed)).toBeCloseTo(1.6, 12);
    const [a, b] = share(view, at);
    const [c, d] = share(zoomed, at);
    expect(c).toBeCloseTo(a as number, 12);
    expect(d).toBeCloseTo(b as number, 12);
    // Zooming back out returns the same view.
    const back = zoomAt(zoomed, at, 1 / 2.5);
    expect(back.minX).toBeCloseTo(view.minX, 12);
    expect(back.maxY).toBeCloseTo(view.maxY, 12);
  });

  it('fits a box with a margin on every side', () => {
    const box = { minX: 0, minY: 0, maxX: 4, maxY: 2 };
    const view = fit(box, 0.1);
    expect(view).toEqual({ minX: -0.4, minY: -0.4, maxX: 4.4, maxY: 2.4 });
    expect(contains(view, box)).toBe(true);
  });

  it('frames each step around its elements and what they are built from', () => {
    // Step 1: the circle, radius 1.
    expect(
      contains(stepFrame(model, 1), { minX: -1, minY: -1, maxX: 1, maxY: 1 }),
    ).toBe(true);
    // Step 6: the tile's corners at ±1.
    expect(
      contains(stepFrame(model, 6), { minX: -1, minY: -1, maxX: 1, maxY: 1 }),
    ).toBe(true);
    for (let step = 1; step <= 6; step++) {
      const frame = stepFrame(model, step);
      expect(width(frame)).toBeGreaterThanOrEqual(
        MIN_FRAME * width(drawingBox(model)),
      );
    }
  });

  it('shows everything drawn so far, and only ever widens', () => {
    const m = loadModel(bou);
    const beats = Math.max(
      ...[...m.scene.elements.values()].map((el) => el.beat),
    );
    let before = growingFrame(m, 1);
    expect(width(before)).toBeGreaterThanOrEqual(
      MIN_GROWING * width(drawingBox(m)) - 1e-9,
    );
    for (let beat = 2; beat <= beats; beat++) {
      const frame = growingFrame(m, beat);
      expect(contains(frame, before)).toBe(true);
      for (const el of m.scene.elements.values()) {
        if (el.beat <= beat && el.geometry.kind === 'point')
          expect(
            contains(frame, {
              minX: el.geometry.at.x,
              minY: el.geometry.at.y,
              maxX: el.geometry.at.x,
              maxY: el.geometry.at.y,
            }),
          ).toBe(true);
      }
      before = frame;
    }
  });

  it('never frames a step smaller than a share of the whole drawing', () => {
    // A line through two neighbouring crossings: a box 0.41 wide.
    const t = structuredClone(example) as {
      steps: { id: number; text: string; create: object }[];
    };
    t.steps.push({
      id: 7,
      text: 'A short line.',
      create: { short: { line: { through: ['k.1', 'k.2'] } } },
    });
    const m = loadModel(t);
    const frame = stepFrame(m, 7);
    // 60% of the drawing's width of 2, plus a 12% margin on each side.
    expect(width(frame)).toBeCloseTo(
      MIN_FRAME * width(drawingBox(m)) * 1.24,
      9,
    );
    // Centred between the two crossings, on the 45° diagonal.
    expect(centreOf(frame).x).toBeCloseTo(0.5, 12);
    expect(centreOf(frame).y).toBeCloseTo(0.5, 12);
  });
});

describe('the camera in the player', () => {
  const box = () => {
    const [x, y, w, h] = (
      document.querySelector('svg.drawing')?.getAttribute('viewBox') ?? ''
    )
      .split(' ')
      .map(Number);
    return { x: x as number, y: y as number, w: w as number, h: h as number };
  };
  const reduceMotion = () =>
    fireEvent.click(screen.getByLabelText('Reduce motion'));

  it('zooms in with the wheel and out again', () => {
    render(<Play json={example} />);
    reduceMotion();
    const before = box().w;
    const svg = document.querySelector('svg.drawing') as SVGSVGElement;
    fireEvent.wheel(svg, { deltaY: -200 });
    expect(box().w).toBeLessThan(before);
    fireEvent.wheel(svg, { deltaY: 200 });
    expect(box().w).toBeCloseTo(before, 9);
  });

  it('pans when dragged', () => {
    render(<Play json={example} />);
    reduceMotion();
    const svg = document.querySelector('svg.drawing') as SVGSVGElement;
    const before = box();
    fireEvent.pointerDown(svg, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(svg, { clientX: 150, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(svg, { pointerId: 1 });
    const after = box();
    expect(after.x).toBeLessThan(before.x); // dragged right: the view moves left
    expect(after.y).toBeLessThan(before.y); // dragged down: the view moves up
    expect(after.w).toBeCloseTo(before.w, 12);
  });

  it('fits the whole drawing, and frames what is drawn so far on Next', () => {
    render(<Play json={example} />);
    reduceMotion();
    const svg = document.querySelector('svg.drawing') as SVGSVGElement;
    fireEvent.wheel(svg, { deltaY: -500 });
    fireEvent.click(screen.getByRole('button', { name: 'Fit' }));
    expect(box().w).toBeCloseTo(width(fullView(model)), 9);
    fireEvent.wheel(svg, { deltaY: -500 });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(box().w).toBeCloseTo(width(growingFrame(model, 2)), 9);
  });

  it('holds still while a step works inside what is already shown', () => {
    vi.useFakeTimers();
    try {
      render(<Play json={example} />);
      reduceMotion();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      const w = box().w;
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(box().w).toBeCloseTo(w, 9);
      expect(w).toBeCloseTo(width(growingFrame(model, 2)), 9);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('zoom limits', () => {
  it('stops zooming out at three times the frame, and in at a twentieth', () => {
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    const svg = document.querySelector('svg.drawing') as SVGSVGElement;
    const w = () => Number((svg.getAttribute('viewBox') ?? '').split(' ')[2]);
    const frame = w();
    for (let i = 0; i < 30; i++) fireEvent.wheel(svg, { deltaY: 500 });
    expect(w()).toBeCloseTo(frame * 3, 9);
    for (let i = 0; i < 60; i++) fireEvent.wheel(svg, { deltaY: -500 });
    expect(w()).toBeCloseTo(frame / 20, 9);
  });
});
