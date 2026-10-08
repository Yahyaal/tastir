import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import dado from '@tutorials/alhambra-comares-dado.json';
import infantas from '@tutorials/alhambra-infantas-crosses.json';
import bones from '@tutorials/alhambra-comares-bones.json';
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
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));
const steps = () => screen.getByRole('navigation', { name: 'Steps' });
const inkBoard = () =>
  screen.getByRole('img', { name: 'The construction so far' });
const inked = () => inkBoard().querySelectorAll('.ink-piece.inked').length;
const rings = () => [...inkBoard().querySelectorAll('.hint-ring')];
const clickRing = (r: Element) =>
  clickAt(Number(r.getAttribute('cx')), Number(r.getAttribute('cy')));
const ticked = () =>
  within(steps())
    .getAllByRole('button', { name: /^Step \d/ })
    .filter((b) => /on your board/.test(b.getAttribute('aria-label') ?? ''))
    .map((b) => b.textContent?.replace(/\D/g, ''));
const status = () =>
  document.querySelector('.along-check[role="status"]')?.textContent ?? '';
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
  window.localStorage.clear();
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

  it('ends by inking the board with a pen, and keeps the drawing as a pattern that plays from the repeat', () => {
    openAlong();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    expect(screen.getByRole('toolbar', { name: 'Ink' })).toBeTruthy();
    const go = screen.getByRole('button', { name: 'Repeat and color it' });
    expect((go as HTMLButtonElement).disabled).toBe(true);
    // Copies are off at first.
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Also ink the copies round the centre',
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
    // The pen goes round the star: E, its crossing with the other square,
    // NE, and so on, sixteen straight strokes back to E.
    const k = 0.76537;
    const corner = (j: number) => {
      const a = (22.5 * j * Math.PI) / 180;
      const r = j % 2 ? k : 1;
      return [r * Math.cos(a), r * Math.sin(a)] as const;
    };
    clickAt(...corner(0));
    expect(document.querySelector('.pen-at')).toBeTruthy();
    clickAt(...corner(1));
    // One stroke inks only its own stretch, no copies.
    expect(inked()).toBe(1);
    for (let j = 2; j <= 16; j++) clickAt(...corner(j % 16));
    expect(status()).toMatch(/Your ink closes the pattern’s pieces/);
    // The pen stays at the last dot until it is lifted.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('.pen-at')).toBeNull();
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

  it('starts with no tool chosen, and the step to copy names only what its text uses', () => {
    openAlong();
    const bar = screen.getByRole('toolbar', { name: 'Tools' });
    expect(
      within(bar)
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-pressed') === 'true'),
    ).toEqual([]);
    expect(status()).toBe('Not on your board yet.');
    for (let i = 0; i < 4; i++) click('Next');
    const step = screen.getByRole('img', {
      name: 'The construction after step 5',
    });
    const names = [...step.querySelectorAll('text')].map((t) => t.textContent);
    // Its corners, which it highlights; never the engine's k.1 … k.8.
    expect(names.sort()).toEqual(['NE', 'NW', 'SE', 'SW']);
  });

  it('ticks a step that only marks points after the step before it, and the tile only once it is marked', () => {
    act(() => {
      window.location.hash = '#/alhambra-comares-dado/draw';
    });
    render(<App entries={[{ id: 'alhambra-comares-dado', json: dado }]} />);
    expect(ticked()).toEqual([]);
    click('Draw it for me');
    click('Next');
    click('Draw it for me');
    // The tile's sides lie on lines already drawn, but it is not marked.
    expect(ticked()).toEqual(['1', '2']);
    for (let i = 0; i < 6; i++) {
      click('Next');
      click('Draw it for me');
    }
    click('Next');
    expect(current()).toBe('9');
    expect(status()).toMatch(/the tile, marked with the Tile tool/);
    click('Draw it for me');
    expect(ticked()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  it('comes back to the same board and step after leaving at step 4', () => {
    openAlong();
    for (let i = 0; i < 3; i++) {
      click('Draw it for me');
      click('Next');
    }
    expect(current()).toBe('4');
    // An extra circle of the learner's own, to be kept too.
    tool('Compass');
    clickAt(1, 0);
    clickAt(0, 0);
    cleanup();
    openAlong();
    expect(current()).toBe('4');
    expect(ticked()).toEqual(['1', '2', '3']);
    expect(screen.getByText(/Welcome back/)).toBeTruthy();
    expect(document.querySelectorAll('.editor-drawing .el.extra')).toHaveLength(
      1,
    );
    // Start again asks first, then empties the board.
    click('Start again');
    click('Start again');
    expect(current()).toBe('1');
    expect(ticked()).toEqual([]);
  });

  it('has a Draw along button on beginner cards and in the player', () => {
    act(() => {
      window.location.hash = '';
    });
    render(
      <App
        entries={[
          { id: 'eight-fold-star-and-cross', json: example },
          { id: 'alhambra-comares-dado', json: dado },
        ]}
      />,
    );
    const draw = screen.getAllByRole('link', { name: 'Draw along' });
    expect(draw.map((a) => a.getAttribute('href')).sort()).toEqual([
      '#/alhambra-comares-dado/draw',
      '#/eight-fold-star-and-cross/draw',
    ]);
    cleanup();
    act(() => {
      window.location.hash = '#/eight-fold-star-and-cross';
    });
    render(
      <App entries={[{ id: 'eight-fold-star-and-cross', json: example }]} />,
    );
    expect(
      screen.getByRole('link', { name: 'Draw along' }).getAttribute('href'),
    ).toBe('#/eight-fold-star-and-cross/draw');
  });

  it('keeps the same layout at the ink, with hints there too', () => {
    openAlong();
    const cells = () =>
      [...(document.querySelector('.along-grid')?.children ?? [])].map(
        (c) =>
          c.className.split(' ').find((n) => n.startsWith('along-')) ??
          c.className,
      );
    const atStep = cells();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    expect(cells()).toEqual(atStep);
    expect(screen.getByText(/Click a dot to put the pen down/)).toBeTruthy();
    const board = () =>
      screen.getByRole('img', { name: 'The construction so far' });
    click('Show me a hint');
    expect(board().querySelectorAll('.ink-piece.glow').length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(/still to ink, round the star/)).toBeTruthy();
    click('Show me more');
    expect(board().querySelectorAll('.hint-ring')).toHaveLength(2);
    expect(
      screen.getByText(
        /Put the pen on the first ringed dot, then click the second/,
      ),
    ).toBeTruthy();
    click('Show me more');
    expect(board().querySelectorAll('.ink-piece.answer')).toHaveLength(16);
  });

  it('inks the copies round the centre only when asked, and a pinwheel without mirror images', () => {
    act(() => {
      window.location.hash = '#/alhambra-infantas-crosses/draw';
    });
    render(
      <App entries={[{ id: 'alhambra-infantas-crosses', json: infantas }]} />,
    );
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    // One stroke the hint shows, without copies, then with them.
    while (rings().length < 2) click(/^Show me/);
    const [a, b] = rings() as [Element, Element];
    clickRing(a);
    clickRing(b);
    const one = inked();
    expect(one).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(inked()).toBe(0);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Also ink the copies round the centre',
      }),
    );
    clickRing(a);
    clickRing(b);
    // Turned four times; the pinwheel is not its own mirror image.
    expect(inked()).toBe(4 * one);
    click('Ink it for me');
    expect(status()).toMatch(/Your ink closes the pattern’s pieces/);
  });

  it('shows no name for a crossing the tutorial does not name', () => {
    openAlong();
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    clickAt(1, 0);
    clickAt(0, 0);
    // A line through O and a crossing of the two circles, which the
    // board names P1 for itself.
    tool('Ruler');
    clickAt(0, 0);
    clickAt(0.5, Math.sqrt(3) / 2);
    const board = screen.getByRole('img', { name: 'The construction so far' });
    const names = [...board.querySelectorAll('text')].map((t) => t.textContent);
    expect(names).not.toContain('P1');
    expect(names).toContain('O');
  });

  it('keeps each figure once when the learner drew it twice', () => {
    openAlong();
    // The circle drawn twice.
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    clickAt(0, 0);
    clickAt(1, 0);
    for (let i = 0; i < 6; i++) {
      if (
        !(
          screen.getByRole('button', {
            name: 'Draw it for me',
          }) as HTMLButtonElement
        ).disabled
      )
        click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    click('Ink it for me');
    fireEvent.click(
      screen.getByRole('button', { name: 'Repeat and color it' }),
    );
    const kept = listPatterns()[0]?.tutorial;
    const circles = (kept?.steps ?? []).flatMap((st) =>
      Object.values(st.create ?? {}).filter(
        (el) => 'circle' in el && el.circle.centre === 'O',
      ),
    );
    expect(circles).toHaveLength(1);
  });

  it.each([
    ['alhambra-infantas-crosses', infantas],
    ['alhambra-comares-bones', bones],
  ] as const)('inks %s by pen strokes, following the hints', (id, json) => {
    act(() => {
      window.location.hash = `#/${id}/draw`;
    });
    render(<App entries={[{ id, json }]} />);
    for (let i = 0; i < 6; i++) {
      if (
        !(
          screen.getByRole('button', {
            name: 'Draw it for me',
          }) as HTMLButtonElement
        ).disabled
      )
        click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    for (let k = 0; k < 120 && !/✓/.test(status()); k++) {
      while (!rings().length) click(/^Show me/);
      const rs = rings();
      if (rs.length === 2) {
        // A stroke still to ink: pen down on the first, then the second.
        clickRing(rs[0] as Element);
        clickRing(rs[1] as Element);
      } else {
        // An extra bit: lift the pen and click it to erase it.
        fireEvent.keyDown(window, { key: 'Escape' });
        clickRing(rs[0] as Element);
      }
      fireEvent.keyDown(window, { key: 'Escape' });
    }
    expect(status()).toMatch(/Your ink closes the pattern’s pieces/);
  });
});
