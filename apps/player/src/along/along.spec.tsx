import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import App from '../app/app';
import { listPatterns } from '../editor/patterns';
import { TOOLS } from '../editor/tools';

/** Clicks the board at a point of the frame (x right, y up). */
function clickAt(x: number, y: number) {
  const svg = screen.getByRole('img', { name: 'The construction so far' });
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  const [vx = 0, vy = 0, vw = 1, vh = 1] = (svg.getAttribute('viewBox') ?? '')
    .split(' ')
    .map(Number);
  const s = Math.min(400 / vw, 400 / vh);
  fireEvent.click(svg, {
    clientX: (x - vx) * s + (400 - vw * s) / 2,
    clientY: (-y - vy) * s + (400 - vh * s) / 2,
  });
}

const tool = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('toolbar', { name: 'Tools' })).getByRole('button', {
      name: new RegExp(name),
    }),
  );
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));
const steps = () => screen.getByRole('navigation', { name: 'Steps' });
const ticked = () =>
  within(steps())
    .getAllByRole('button', { name: /^Step \d/ })
    .filter((b) => /on your board/.test(b.getAttribute('aria-label') ?? ''))
    .map((b) => b.textContent?.replace(/\D/g, ''));
const status = () => document.querySelector('.along-check')?.textContent ?? '';
const current = () =>
  within(steps())
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-current') === 'step')
    ?.textContent?.replace(/\D/g, '');

function openAlong() {
  act(() => {
    window.location.hash = '#/eight-fold-star-and-cross/draw';
  });
  render(
    <App entries={[{ id: 'eight-fold-star-and-cross', json: example }]} />,
  );
}

afterEach(() => {
  window.location.hash = '';
});

describe('drawing along', () => {
  it('draws the first three steps of the star and cross, peeking ahead to step 5 and back', () => {
    openAlong();
    expect(
      screen.getByText(/Draw along: Eight-fold star and cross/),
    ).toBeTruthy();
    // The step to copy is the player's drawing, beside the board.
    expect(
      screen.getByRole('img', { name: 'The construction after step 1' }),
    ).toBeTruthy();
    expect(ticked()).toEqual([]);
    expect(status()).toBe('Not on your board yet.');

    // Step 1: the circle.
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    expect(ticked()).toEqual(['1']);
    expect(status()).toMatch(/Step 1 is on your board/);

    // Next is always open: peek ahead to step 5, then back to step 2.
    for (let i = 0; i < 4; i++) click('Next');
    expect(current()).toBe('5');
    expect(
      screen.getByRole('img', { name: 'The construction after step 5' }),
    ).toBeTruthy();
    for (let i = 0; i < 3; i++) click('Back');
    expect(current()).toBe('2');

    // Step 2: the horizontal, then the vertical; half done in between.
    tool('Ruler');
    clickAt(0, 0);
    clickAt(1, 0);
    expect(ticked()).toEqual(['1']);
    expect(status()).toBe('Still to draw: one line.');
    tool('Square to');
    clickAt(-0.5, 0);
    clickAt(0, 0);
    expect(ticked()).toEqual(['1', '2']);

    // Step 3: both diagonals, by halving the two right angles.
    click('Next');
    tool('Halve angle');
    clickAt(1, 0);
    clickAt(0, 0);
    clickAt(0, 1);
    expect(status()).toBe('Still to draw: one line.');
    tool('Halve angle');
    clickAt(0, 1);
    clickAt(0, 0);
    clickAt(-1, 0);
    expect(ticked()).toEqual(['1', '2', '3']);
    expect(status()).toMatch(/Step 3 is on your board/);
    // The board names the crossings it took as the tutorial does.
    expect(screen.getAllByText('N').length).toBeGreaterThan(0);
  });

  it('counts a step drawn another way, and keeps extras without counting them against the learner', () => {
    openAlong();
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    // An extra circle about A: kept, faint, and step 1 stays done.
    clickAt(1, 0);
    clickAt(0, 0);
    expect(ticked()).toEqual(['1']);
    expect(document.querySelectorAll('.editor-drawing .el.extra')).toHaveLength(
      1,
    );
    // Undo takes the extra back.
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(document.querySelectorAll('.editor-drawing .el.extra')).toHaveLength(
      0,
    );
  });

  it('says what every tool does, in a tooltip and to a screen reader', () => {
    openAlong();
    const bar = screen.getByRole('toolbar', { name: 'Tools' });
    for (const t of TOOLS) {
      const button = within(bar).getByRole('button', {
        name: new RegExp(t.label),
      });
      expect(button.getAttribute('title')).toBe(t.does);
      expect(button.getAttribute('aria-description')).toBe(t.does);
    }
    expect(
      within(bar).getByRole('button', { name: 'Undo' }).getAttribute('title'),
    ).toBeTruthy();
  });

  it('gives hints a level at a time on step 3, and draws it for the learner', () => {
    openAlong();
    click('Draw it for me');
    click('Next');
    click('Draw it for me');
    click('Next');
    expect(ticked()).toEqual(['1', '2']);
    const board = () =>
      screen.getByRole('img', { name: 'The construction so far' });
    // Level 1: the horizontal and the vertical glow.
    click('Show me a hint');
    expect(board().querySelectorAll('.el.glow')).toHaveLength(2);
    expect(board().querySelectorAll('.hint-ring')).toHaveLength(0);
    // Level 2: the points to click are ringed, and so is the tool.
    click('Show me more');
    expect(board().querySelectorAll('.hint-ring')).toHaveLength(3);
    const halve = within(
      screen.getByRole('toolbar', { name: 'Tools' }),
    ).getByRole('button', { name: /Halve angle/ });
    expect(halve.className).toMatch(/hinted/);
    expect(screen.getByText(/Use Halve angle/)).toBeTruthy();
    // Level 3: the answer, dashed: both diagonals.
    click('Show me more');
    expect(board().querySelectorAll('.answer')).toHaveLength(2);
    // Draw it for me puts the step on the board, and the hints go.
    click('Draw it for me');
    expect(ticked()).toEqual(['1', '2', '3']);
    expect(
      board().querySelectorAll('.answer, .hint-ring, .el.glow'),
    ).toHaveLength(0);
    // The board names the points as the tutorial does.
    click('Next');
    click('Draw it for me');
    expect(ticked()).toEqual(['1', '2', '3', '4']);
  });

  it('ends by inking the board, and keeps the drawing as a pattern that plays from the repeat', () => {
    openAlong();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    expect(screen.getByRole('toolbar', { name: 'Ink' })).toBeTruthy();
    const go = screen.getByRole('button', { name: 'Repeat and color it' });
    expect((go as HTMLButtonElement).disabled).toBe(true);
    // One click on a side of a star tip inks the star, with its copies.
    const k = 0.76537;
    const a = (22.5 * Math.PI) / 180;
    clickAt((1 + k * Math.cos(a)) / 2, (k * Math.sin(a)) / 2);
    expect(status()).toMatch(/Your ink closes the pattern’s pieces/);
    fireEvent.click(go);
    const kept = listPatterns()[0];
    expect(kept?.basedOn?.tutorial).toBe('eight-fold-star-and-cross');
    expect(kept?.tutorial.title).toBe('My Eight-fold star and cross');
    expect(kept?.tutorial.credits.at(-1)?.note).toMatch(/Drawn along/);
    expect(window.location.hash).toBe(`#/mine/${kept?.id}/repeat`);
    expect(kept?.tutorial.expect?.pieces.map((p) => p.name).sort()).toEqual([
      'cross',
      'star',
    ]);
  });
});
