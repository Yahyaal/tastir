import { act, fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { compassStart, planStep } from './animation';
import App from './app';
import { loadModel } from './model';

const model = loadModel(example);

interface Call {
  name: string | null;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** Records element.animate calls; each animation can be finished by hand. */
function recordAnimations() {
  const calls: Call[] = [];
  const pending: (() => void)[] = [];
  const animate = vi.fn(function (
    this: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    calls.push({ name: this.getAttribute('data-name'), keyframes, options });
    let done: () => void = () => undefined;
    const finished = new Promise<void>((resolve) => (done = resolve));
    pending.push(done);
    return { finished, finish: done } as unknown as Animation;
  });
  Element.prototype.animate = animate;
  /** Lets every recorded animation end. */
  const finishAll = async () => {
    await act(async () => {
      pending.splice(0).forEach((f) => f());
    });
  };
  return { calls, finishAll };
}

afterEach(() => {
  delete (Element.prototype as { animate?: unknown }).animate;
});

const label = () => document.querySelector('.label')?.textContent;
const next = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
const back = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
const named = (calls: Call[]) => [...new Set(calls.map((c) => c.name))];

describe('planning a step', () => {
  it('draws the lines one after the other, then pops the points, in 0.8 s', () => {
    const plan = planStep(model, 2);
    expect(plan.map((e) => [e.name, e.kind])).toEqual([
      ['h', 'ruler'],
      ['v', 'ruler'],
      ['E', 'pop'],
      ['N', 'pop'],
      ['W', 'pop'],
      ['S', 'pop'],
    ]);
    expect(plan[0]).toMatchObject({ delay: 0, duration: 300 });
    expect(plan[1]).toMatchObject({ delay: 300, duration: 300 });
    expect(plan[2]?.delay).toBe(600);
    const end = Math.max(...plan.map((e) => e.delay + e.duration));
    expect(end).toBeCloseTo(800, 9);
  });

  it('sweeps a circle with the compass for the whole step', () => {
    expect(planStep(model, 1)).toEqual([
      { name: 'c', kind: 'compass', delay: 0, duration: 800 },
    ]);
  });

  it('scales the timing with the speed', () => {
    const fast = planStep(model, 2, 2);
    expect(fast[1]).toMatchObject({ delay: 150, duration: 150 });
    const slow = planStep(model, 2, 0.5);
    expect(Math.max(...slow.map((e) => e.delay + e.duration))).toBeCloseTo(
      1600,
      9,
    );
  });

  it('starts the compass at the point the circle passes through', () => {
    expect(compassStart(model, 'c')).toBeCloseTo(0, 12); // through A, at 0°
  });
});

describe('highlight before draw', () => {
  it('flashes the highlighted points first, then draws', () => {
    const plan = planStep(model, 4);
    expect(plan.map((e) => [e.name, e.kind, e.delay, e.duration])).toEqual([
      ['E', 'flash', 0, 600],
      ['N', 'flash', 0, 600],
      ['W', 'flash', 0, 600],
      ['S', 'flash', 0, 600],
      ['dynamic', 'ruler', 600, 800],
    ]);
  });

  it('opens groups and scales the flash with the speed', () => {
    const t = structuredClone(example) as { steps: { highlight?: string[] }[] };
    (t.steps[5] as { highlight?: string[] }).highlight = ['k', 'h'];
    const plan = planStep(loadModel(t), 6, 2);
    const flashed = plan.filter((e) => e.kind === 'flash');
    expect(flashed.map((e) => e.name)).toEqual([
      'k.1',
      'k.2',
      'k.3',
      'k.4',
      'k.5',
      'k.6',
      'k.7',
      'k.8',
      'h',
    ]);
    expect(flashed[0]?.duration).toBe(300);
    expect(plan.find((e) => e.kind === 'ruler')?.delay).toBe(300);
  });

  it('leaves the flash out when undrawing', () => {
    expect(planStep(model, 4, 1, { flash: false }).map((e) => e.kind)).toEqual([
      'ruler',
    ]);
  });

  it('flashes in the player before the square draws, without leaving a trace', () => {
    const { calls } = recordAnimations();
    render(<App />);
    next();
    next();
    calls.length = 0;
    next(); // step 4
    const flashE = calls.filter((c) => c.name === 'E');
    expect(flashE).toHaveLength(2); // the point and its name
    expect(flashE[0]?.options).toMatchObject({
      delay: 0,
      duration: 600,
      fill: 'none',
    });
    const square = calls.find((c) => c.name === 'dynamic');
    expect(square?.options.delay).toBe(600);
  });

  it('outlines the highlighted elements instead with reduced motion', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    next();
    next(); // step 3 highlights h and v
    const outlined = [...container.querySelectorAll('.el.highlighted')].map(
      (n) => n.getAttribute('data-name'),
    );
    expect(outlined).toEqual(['h', 'v']);
    next(); // step 4 highlights E, N, W and S
    const marks = [...container.querySelectorAll('.mark.highlighted')].map(
      (n) => n.getAttribute('data-name'),
    );
    expect(marks).toEqual(['E', 'N', 'W', 'S']);
    expect(container.querySelectorAll('.el.highlighted')).toHaveLength(0);
  });

  it('does not outline anything when the flash plays', () => {
    const { container } = render(<App />);
    next();
    next();
    expect(
      container.querySelectorAll('.highlighted.el, .highlighted.mark'),
    ).toHaveLength(0);
  });
});

describe('animating in the player', () => {
  it('sweeps the first circle on load', () => {
    const { calls } = recordAnimations();
    render(<App />);
    expect(named(calls)).toEqual(['c']);
    expect(calls[0]?.options).toMatchObject({
      duration: 800,
      delay: 0,
      fill: 'backwards',
      direction: 'normal',
    });
    expect(calls[0]?.keyframes[0]).toMatchObject({ strokeDashoffset: 1 });
  });

  it('animates the new step on Next, at the chosen speed', () => {
    const { calls } = recordAnimations();
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Speed/), {
      target: { value: '2' },
    });
    calls.length = 0;
    next();
    expect(label()).toBe('Step 2 of 6');
    // The two lines, then the four points with their names.
    expect(named(calls)).toEqual(['h', 'v', 'E', 'N', 'W', 'S']);
    const v = calls.find((c) => c.name === 'v');
    expect(v?.options).toMatchObject({ delay: 150, duration: 150 });
    const pops = calls.filter((c) => c.name === 'E');
    expect(pops).toHaveLength(2); // the dot and its label
    expect(pops[0]?.keyframes[0]).toMatchObject({ transform: 'scale(0)' });
  });

  it('undraws the step backwards on Back, then shows the previous one', async () => {
    const { calls, finishAll } = recordAnimations();
    render(<App />);
    next();
    await finishAll();
    calls.length = 0;
    back();
    expect(label()).toBe('Step 2 of 6'); // still undrawing
    expect(named(calls)).toEqual(['h', 'v', 'E', 'N', 'W', 'S']);
    const h = calls.find((c) => c.name === 'h');
    expect(h?.options).toMatchObject({
      direction: 'reverse',
      fill: 'forwards',
      // Drawn first, so undrawn last: 800 − 300.
      delay: 500,
    });
    await finishAll();
    expect(label()).toBe('Step 1 of 6');
  });

  it('draws every step at once with reduced motion', () => {
    const { calls } = recordAnimations();
    render(<App />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    calls.length = 0;
    next();
    next();
    back();
    expect(label()).toBe('Step 2 of 6');
    expect(calls).toEqual([]);
  });
});
