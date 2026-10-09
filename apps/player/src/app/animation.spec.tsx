import { act, fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { compassStart, planStep, usedNames } from './animation';
import { Play } from './app';
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
    render(<Play json={example} />);
    next();
    next();
    calls.length = 0;
    next(); // step 4
    const flashE = calls.filter((c) => c.name === 'E');
    expect(flashE).toHaveLength(1); // the point (names are off)
    expect(flashE[0]?.options).toMatchObject({
      delay: 0,
      duration: 600,
      fill: 'none',
    });
    const square = calls.find((c) => c.name === 'dynamic');
    expect(square?.options.delay).toBe(600);
  });

  it('shows what the step works from in saffron, with no ring that could pass for a circle', () => {
    const { container } = render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    next();
    next(); // step 3 works from h and v
    const used = [...container.querySelectorAll('.el.used')].map((n) =>
      n.getAttribute('data-name'),
    );
    expect(used).toEqual(['h', 'v']);
    next(); // step 4 works from E, N, W and S
    const marks = [...container.querySelectorAll('.mark.used')].map((n) =>
      n.getAttribute('data-name'),
    );
    expect(marks).toEqual(['E', 'N', 'W', 'S']);
    expect(container.querySelectorAll('.mark-ring')).toHaveLength(0);
    expect(container.querySelectorAll('.el.used')).toHaveLength(0);
  });

  it('turns what the last step made from blue to its new colour on Next', () => {
    const { container } = render(<Play json={example} />);
    next(); // step 2 makes h, v and E, N, W, S
    next(); // step 3
    const was = [...container.querySelectorAll('.was-new')].map((n) =>
      n.getAttribute('data-name'),
    );
    expect(was).toEqual(expect.arrayContaining(['h', 'v']));
    // Back shows the step as it is, with no change of colour.
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(container.querySelectorAll('.was-new')).toHaveLength(0);
  });

  it('sweeps the first circle on load', () => {
    const { calls } = recordAnimations();
    render(<Play json={example} />);
    expect(named(calls)).toEqual(['c']);
    expect(calls[0]?.options).toMatchObject({
      duration: 800,
      delay: 0,
      fill: 'backwards',
      direction: 'normal',
    });
    expect(calls[0]?.keyframes[0]).toMatchObject({
      opacity: 0,
      strokeDashoffset: 1,
    });
    expect(calls[0]?.keyframes[1]).toMatchObject({
      opacity: 1,
      strokeDashoffset: 1,
    });
  });

  it('animates the new step on Next, at the chosen speed', () => {
    const { calls } = recordAnimations();
    render(<Play json={example} />);
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
    expect(pops).toHaveLength(1); // the dot (names are off)
    expect(pops[0]?.keyframes[0]).toMatchObject({ transform: 'scale(0)' });
  });

  it('undraws the step backwards on Back, then shows the previous one', async () => {
    const { calls, finishAll } = recordAnimations();
    render(<Play json={example} />);
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
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    calls.length = 0;
    next();
    next();
    back();
    expect(label()).toBe('Step 2 of 6');
    expect(calls).toEqual([]);
  });
});

describe('what a step works from', () => {
  it('is the highlight list when the step has one', () => {
    expect(usedNames(model, 4)).toEqual(['E', 'N', 'W', 'S']);
  });

  it("is otherwise what the step's new elements are built from", () => {
    // Step 2 rules h through O and A, v through O, and marks the circle.
    expect(usedNames(model, 2).sort()).toEqual(['A', 'O', 'c']);
  });
});

describe('inking as you go', () => {
  it("draws the step's new ink after its lines", () => {
    const plain = planStep(model, 5);
    const plan = planStep(model, 5, 1, { ink: true });
    const ink = plan.find((e) => e.name === 'ink-fresh');
    expect(ink?.kind).toBe('ruler');
    expect(ink?.delay).toBeGreaterThanOrEqual(
      Math.max(...plain.map((e) => e.delay + e.duration)),
    );
    expect(
      planStep(model, 4, 1, { ink: true }).map((e) => e.name),
    ).not.toContain('ink-fresh');
  });
});
