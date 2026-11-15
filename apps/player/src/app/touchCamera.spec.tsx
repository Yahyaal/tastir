import { act, fireEvent, renderHook } from '@testing-library/react';
import { useCamera } from './useCamera';
import { width } from './camera';

describe('touch camera gestures', () => {
  const frame = { minX: -5, maxX: 5, minY: -5, maxY: 5 };
  function setup() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.defineProperty(svg, 'clientWidth', { value: 1000 });
    const capture = vi.fn();
    svg.setPointerCapture = capture;
    const ref = { current: svg };
    const hook = renderHook(() => useCamera(frame, ref, { instant: true }));
    const pointer = (
      kind: 'down' | 'move' | 'up' | 'cancel',
      id: number,
      x = 500,
      y = 500,
    ) => {
      const event = new PointerEvent('pointer' + kind, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
      });
      act(() => {
        svg.dispatchEvent(event);
      });
    };
    return { ...hook, svg, capture, pointer };
  }
  it('zooms in and out, keeps a stationary midpoint, and suppresses a pinch click', () => {
    const { result, pointer } = setup();
    pointer('down', 1, 400);
    pointer('down', 2, 600);
    pointer('move', 1, 300);
    pointer('move', 2, 700);
    expect(width(result.current.view)).toBeCloseTo(5);
    expect(result.current.view.minX).toBeCloseTo(-2.5);
    pointer('move', 1, 400);
    pointer('move', 2, 600);
    expect(width(result.current.view)).toBeCloseTo(10);
    pointer('up', 1);
    pointer('up', 2);
    expect(result.current.wasDrag()).toBe(true);
  });
  it('pans with the moving midpoint and continues with one finger without a jump', () => {
    const { result, pointer } = setup();
    pointer('down', 1, 400);
    pointer('down', 2, 600);
    pointer('move', 1, 500);
    pointer('move', 2, 700);
    expect(width(result.current.view)).toBeCloseTo(10);
    expect(result.current.view.minX).toBeCloseTo(-6);
    pointer('up', 2);
    pointer('move', 1, 550);
    expect(result.current.view.minX).toBeCloseTo(-6.5);
  });
  it('recovers from cancellation, preserves taps, and ignores untracked pointers', () => {
    const { result, pointer, svg, capture } = setup();
    pointer('down', 1, 400);
    expect(capture).not.toHaveBeenCalled(); // preserve the original tap target
    pointer('up', 1);
    expect(result.current.wasDrag()).toBe(false);
    pointer('down', 1, 400);
    pointer('down', 2, 600);
    pointer('cancel', 1);
    pointer('cancel', 2);
    const before = result.current.view;
    pointer('move', 3, 100);
    expect(result.current.view).toEqual(before);
    pointer('down', 3, 500);
    pointer('move', 3, 550);
    pointer('up', 3);
    expect(result.current.view.minX).toBeLessThan(before.minX);
    fireEvent.click(svg);
    expect(result.current.wasDrag()).toBe(true);
  });
  it('keeps both contacts when capture transfers from a child path to the SVG', () => {
    const { result, pointer, svg } = setup();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(path);
    pointer('down', 1, 400);
    pointer('down', 2, 600);
    act(() => {
      path.dispatchEvent(
        new PointerEvent('lostpointercapture', {
          bubbles: true,
          pointerId: 1,
          pointerType: 'touch',
        }),
      );
    });
    pointer('move', 1, 300);
    pointer('move', 2, 700);
    expect(width(result.current.view)).toBeCloseTo(5);
  });
  it('respects zoom limits even when contacts coincide or move very far apart', () => {
    const { result, pointer } = setup();
    pointer('down', 1, 400);
    pointer('down', 2, 600);
    pointer('move', 1, -100000);
    pointer('move', 2, 100000);
    expect(width(result.current.view)).toBeCloseTo(0.5);
    pointer('move', 1, 600);
    pointer('move', 2, 600);
    expect(width(result.current.view)).toBeCloseTo(30);
  });
});
