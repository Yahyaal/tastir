import { act, fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Player } from './Player';
import { loadModel } from './model';

const model = loadModel(example);
const label = () => document.querySelector('.label')?.textContent;
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('autoplays, preserves the remaining time on pause, and resumes', () => {
  render(<Player model={model} />);
  expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  tick(400);
  click('Pause');
  tick(5000);
  expect(label()).toBe('Step 1 of 6');
  click('Play');
  tick(599);
  expect(label()).toBe('Step 1 of 6');
  tick(1);
  expect(label()).toBe('Step 2 of 6');
});

it('lets Back and Next take over and pauses automatic advancement', () => {
  render(<Player model={model} />);
  click('Next');
  expect(label()).toBe('Step 2 of 6');
  expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  tick(5000);
  expect(label()).toBe('Step 2 of 6');
  click('Back');
  expect(label()).toBe('Step 1 of 6');
  tick(5000);
  expect(label()).toBe('Step 1 of 6');
});

it('finishes at the result and can replay from the beginning', () => {
  render(<Player model={model} />);
  for (let step = 0; step < 8; step++) tick(1000);
  expect(label()).toBe('Color');
  click('Replay');
  expect(label()).toBe('Step 1 of 6');
  tick(1000);
  expect(label()).toBe('Step 2 of 6');
});

it('opens the result calmly and starts the movie when Watch it drawn is selected', () => {
  render(<Player model={model} start="result" />);
  tick(5000);
  expect(label()).toBe('Color');
  fireEvent.click(screen.getByRole('link', { name: 'Watch it drawn' }));
  expect(label()).toBe('Step 1 of 6');
  tick(1000);
  expect(label()).toBe('Step 2 of 6');
});

it('pauses the active strokes and waits for their full duration before advancing', () => {
  const pause = vi.fn();
  const play = vi.fn();
  const original = Element.prototype.animate;
  Element.prototype.animate = vi.fn(
    () =>
      ({
        playState: 'running',
        play,
        pause,
        finish: vi.fn(),
        cancel: vi.fn(),
        effect: { getComputedTiming: () => ({ endTime: 800 }) },
      }) as unknown as Animation,
  );
  try {
    render(<Player model={model} />);
    tick(900);
    expect(label()).toBe('Step 1 of 6');
    click('Pause');
    expect(pause).toHaveBeenCalled();
    click('Play');
    expect(play).toHaveBeenCalled();
    tick(899);
    expect(label()).toBe('Step 1 of 6');
    tick(1);
    expect(label()).toBe('Step 2 of 6');
  } finally {
    if (original) Element.prototype.animate = original;
    else delete (Element.prototype as { animate?: unknown }).animate;
  }
});
