import { fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import bouInania from '@tutorials/bou-inania-rosette.json';
import { parseTutorial } from '@tastir/schema';
import { Play } from './app';
import { loadModel } from './model';

/** Next, or at the ink, Repeat it (the order the player plays in). */
const next = () =>
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Repeat it)$/ }));
const back = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
const label = () => document.querySelector('.label')?.textContent;

describe('the player', () => {
  it('shows where the learner is, and jumps anywhere from the journey', () => {
    render(<Play json={example} />);
    const journey = screen.getByRole('navigation', { name: 'Where you are' });
    expect(journey.querySelector('[aria-current="step"]')?.textContent).toBe(
      '1',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go to color' }));
    expect(label()).toBe('Color');
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }));
    expect(label()).toBe('Step 3 of 6');
    // Steps already passed are marked done.
    expect(
      screen.getByRole('button', { name: 'Go to step 2' }).className,
    ).toContain('done');
  });

  it('starts at step 1 with its text, and Back disabled', () => {
    render(<Play json={example} />);
    expect(
      screen.getByRole('heading', { name: 'Eight-fold star and cross' }),
    ).toBeTruthy();
    expect(label()).toBe('Step 1 of 6');
    expect(
      screen.getByText(
        'Put the compass point on the centre and draw a circle.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('draws the current step in color and earlier ones in grey', () => {
    const { container } = render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Show names'));
    next(); // step 2: h, v and four points
    expect(container.querySelectorAll('line.el.current')).toHaveLength(2);
    expect(container.querySelectorAll('circle.el:not(.current)')).toHaveLength(
      1,
    );
    const names = (selector: string) =>
      [...container.querySelectorAll(selector)].map((t) => t.textContent);
    // E lies on A, so the two share one label with the current step's name.
    expect(names('text.point-name.current')).toEqual(['E', 'N', 'W', 'S']);
    expect(names('text.point-name')).toEqual(['O', 'E', 'N', 'W', 'S']);
  });

  it('names the points a step highlights', () => {
    const { container } = render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Show names'));
    for (let i = 0; i < 3; i++) next(); // step 4 joins E, N, W and S
    const named = [
      ...container.querySelectorAll('text.point-name.highlighted'),
    ].map((t) => t.textContent);
    expect(named).toEqual(['E', 'N', 'W', 'S']);
  });

  it('steps through all six steps, the ink, the repeat and the coloring, and back', () => {
    const { container } = render(<Play json={example} />);
    const seen = [label()];
    for (let i = 0; i < 8; i++) {
      next();
      seen.push(label());
    }
    expect(seen).toEqual([
      'Step 1 of 6',
      'Step 2 of 6',
      'Step 3 of 6',
      'Step 4 of 6',
      'Step 5 of 6',
      'Step 6 of 6',
      'Ink',
      'Repeat',
      'Color',
    ]);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(
      screen.getByText(
        'Color ring by ring, as on real zellige: pick a color, then click a piece, and its whole ring round the rosette takes the color.',
      ),
    ).toBeTruthy();
    // Two rosettes take turns, each coloured ring by ring with the brush.
    expect(screen.getByRole('group', { name: 'Paint with' })).toBeTruthy();
    expect(screen.getByText(/2 rosettes take turns/)).toBeTruthy();
    back();
    expect(label()).toBe('Repeat');
    expect(screen.getByText(/Repeat the tile edge to edge/)).toBeTruthy();
    // One original star in color, copies of it in every other tile.
    expect(
      container.querySelector('.ink.original use')?.getAttribute('href'),
    ).toBe(`#${container.querySelector('defs path.tile-ink')?.id}`);
    // The copies reuse one drawing of the tile's ink.
    expect(
      container.querySelectorAll('.ink:not(.original) use').length,
    ).toBeGreaterThan(8);
    expect(
      container
        .querySelector('defs path.tile-ink')
        ?.getAttribute('d')
        ?.split('M').length,
    ).toBe(17);
    back();
    expect(label()).toBe('Ink');
    expect(container.querySelectorAll('.ink line')).toHaveLength(16);
  });

  it('moves with the arrow keys', () => {
    render(<Play json={example} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(label()).toBe('Step 2 of 6');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(label()).toBe('Step 1 of 6');
  });

  it('lets focused buttons and selectors handle their own keys', () => {
    render(<Play json={example} />);
    const forward = screen.getByRole('button', { name: 'Next' });
    fireEvent.keyDown(forward, { key: 'ArrowRight' });
    fireEvent.keyDown(forward, { key: ' ' });
    expect(label()).toBe('Step 1 of 6');
    fireEvent.click(forward);
    expect(label()).toBe('Step 2 of 6');
    fireEvent.click(screen.getByRole('button', { name: 'Go to color' }));
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Style' }), {
      key: 'ArrowLeft',
    });
    expect(label()).toBe('Color');
  });

  it('does not step for modified or already-handled keyboard events', () => {
    render(<Play json={example} />);
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });
    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true });
    fireEvent.keyDown(window, { key: 'ArrowRight', shiftKey: true });
    const handled = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      cancelable: true,
    });
    handled.preventDefault();
    fireEvent(window, handled);
    expect(label()).toBe('Step 1 of 6');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(label()).toBe('Step 2 of 6');
  });

  it('shows the engine error for a tutorial it cannot play', () => {
    const broken = structuredClone(example) as {
      steps: { create: Record<string, unknown> }[];
    };
    (broken.steps[1] as { create: Record<string, unknown> }).create.E = {
      point: { meet: ['c', 'h'] },
    };
    render(<Play json={broken} />);
    expect(
      screen.getByText(/Step 2, element "E": 2 crossings of "c" and "h" match/),
    ).toBeTruthy();
  });

  it('hides the names until asked, and remembers the choice', () => {
    const { container, unmount } = render(<Play json={example} />);
    next();
    expect(container.querySelectorAll('text.point-name')).toHaveLength(0);
    fireEvent.click(screen.getByLabelText('Show names'));
    expect(
      container.querySelectorAll('text.point-name').length,
    ).toBeGreaterThan(0);
    unmount();
    render(<Play json={example} />);
    expect(screen.getByLabelText('Show names')).toHaveProperty('checked', true);
    fireEvent.click(screen.getByLabelText('Show names'));
  });

  it('dashes the lines that never carry ink', () => {
    const { container } = render(<Play json={example} />);
    for (let i = 0; i < 3; i++) next(); // step 4: the dynamic square
    const helpers = [...container.querySelectorAll('.el.helper')].map((n) =>
      n.getAttribute('data-name'),
    );
    expect(helpers).toEqual(['h', 'v', 'd1', 'd2']);
    expect(
      container.querySelector('[data-name="dynamic"]')?.classList,
    ).not.toContain('helper');
  });

  it('inks as you go when asked: each step’s ink in green, then black', () => {
    const { container } = render(<Play json={example} />);
    const fresh = () => container.querySelectorAll('.ink line.fresh').length;
    const all = () => container.querySelectorAll('.so-far line').length;
    for (let i = 0; i < 4; i++) next(); // step 5: both squares exist
    expect(all()).toBe(0); // inking at the end, by default
    fireEvent.change(screen.getByLabelText(/Ink/), {
      target: { value: 'asYouGo' },
    });
    expect(fresh()).toBe(16);
    back();
    expect(all()).toBe(0); // step 4 inks nothing yet
    next();
    next(); // step 6
    expect(fresh()).toBe(0);
    expect(all()).toBe(16);
    next(); // the ink stage: no pen, the ink is already there
    expect(container.querySelector('.rulers')).toBeNull();
  });

  it('plays a step in parts: “Step 2 · 1 of 2”, then the next part', () => {
    const t = parseTutorial(example);
    const step2 = t.steps[1];
    const { h, v, E, N, W, S } = step2?.create ?? {};
    const split = {
      ...t,
      steps: t.steps.map((s) =>
        s.id === 2
          ? {
              id: 2,
              text: 'Two lines.',
              parts: [
                { text: 'The horizontal.', create: { h, E, W } },
                { text: 'The vertical.', create: { v, N, S } },
              ],
            }
          : s,
      ),
    };
    const { container } = render(<Play json={split} />);
    const seen = [label()];
    next();
    seen.push(label());
    expect(screen.getByText('The horizontal.')).toBeTruthy();
    expect(screen.getByText('Two lines.')).toBeTruthy();
    expect(container.querySelector('[data-name="v"]')).toBeNull();
    next();
    seen.push(label());
    expect(container.querySelector('[data-name="v"]')?.classList).toContain(
      'current',
    );
    expect(container.querySelector('[data-name="h"]')?.classList).not.toContain(
      'current',
    );
    next();
    seen.push(label());
    expect(seen).toEqual([
      'Step 1 of 6',
      'Step 2 · 1 of 2',
      'Step 2 · 2 of 2',
      'Step 3 of 6',
    ]);
  });

  it('draws only the tile on its step, and only the tile with the ink', () => {
    const { container } = render(<Play json={example} />);
    for (let i = 0; i < 5; i++) next(); // step 6 draws the tile
    expect(label()).toBe('Step 6 of 6');
    expect(container.querySelectorAll('[data-next-tile]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-ink]')).toHaveLength(0);
    next(); // the ink stage: the ink of the one tile, nothing round it
    expect(container.querySelectorAll('[data-ink]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-next-tile]')).toHaveLength(0);
    // The points the ink turns at: the star's 8 points and 8 inner
    // corners, each shown with the first ruler line that reaches it.
    expect(container.querySelectorAll('[data-dot-line]')).toHaveLength(16);
  });

  it('colours the unit first when asked at the ink, then repeats it', () => {
    render(<Play json={example} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to ink' }));
    fireEvent.click(screen.getByRole('button', { name: 'Color it' }));
    expect(label()).toBe('Color');
    const phases = [...document.querySelectorAll('.phase-name')].map(
      (p) => p.textContent,
    );
    expect(phases).toEqual(['Ink', 'Color', 'Repeat']);
    next();
    expect(label()).toBe('Repeat');
    fireEvent.click(screen.getByRole('button', { name: '2 × 2' }));
    expect(
      screen.getByRole('img', { name: 'The unit repeated 2 by 2' }),
    ).toBeTruthy();
  });

  it('inks the one tile cut at its edges when the tutorial names a panel', () => {
    const { container } = render(<Play json={bouInania} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to ink' }));
    const model = loadModel(bouInania);
    const panel = model.pattern.panel;
    expect(panel).toBeDefined();
    // The tile and its copies' ink, clipped to the tile's own outline.
    expect(container.querySelectorAll('[data-ink]')).toHaveLength(
      panel?.ink.length ?? 0,
    );
    expect(container.querySelector('[data-tile]')?.getAttribute('points')).toBe(
      model.pattern.cell.corners.map((p) => `${p.x},${-p.y}`).join(' '),
    );
    // The repeat keeps the tile.
    next();
    expect(
      container
        .querySelector('defs path.tile-ink')
        ?.getAttribute('d')
        ?.split('M').length,
    ).toBe(model.pattern.ink.length + 1);
  }, 30000);

  it('skips a hidden step: never shown, never drawn, left out of the count', () => {
    const tutorial = parseTutorial(example);
    const hidden = {
      ...tutorial,
      steps: tutorial.steps.map((s) =>
        s.id === 5 ? { ...s, hidden: true } : s,
      ),
    };
    const { container } = render(<Play json={hidden} />);
    const seen = [label()];
    for (let i = 0; i < 5; i++) {
      next();
      seen.push(label());
      expect(container.querySelector('[data-name="static"]')).toBeNull();
    }
    expect(seen).toEqual([
      'Step 1 of 5',
      'Step 2 of 5',
      'Step 3 of 5',
      'Step 4 of 5',
      'Step 5 of 5',
      'Ink',
    ]);
  });
});
