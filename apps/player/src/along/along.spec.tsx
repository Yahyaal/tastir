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
import { listDesigns } from '../app/designs';
import { dropAt, snapped } from './repeat';
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
  it('warns inside the feedback slot when saving fails and recovers when saving works', () => {
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Storage full', 'QuotaExceededError');
      });
    try {
      openAlong();
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('cannot save your board');
      expect(alert.closest('.along-text')).toBeTruthy();
      click('Draw it for me');
      expect(ticked()).toEqual(['1']);
      write.mockRestore();
      click('Next');
      expect(screen.queryByRole('alert')).toBeNull();
      expect(current()).toBe('2');
      expect(ticked()).toEqual(['1']);
    } finally {
      write.mockRestore();
    }
  });

  it('draws the star and cross by clicking, peeking ahead to step 5 and back', () => {
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

    // Step 1: the circle. Step 2's helper lines find E, N, W and S, which
    // the squares need, so they still count: step 2 is not ticked.
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
    expect(status()).toBe('Not on your board yet.');

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
    click('Next');
    click('Draw it for me');
    expect(ticked()).toEqual(['1', '2', '3', '4']);
  });

  it('ends by inking the board with a pen, and keeps the drawing as one of the learner’s patterns', () => {
    openAlong();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    expect(screen.getByRole('toolbar', { name: 'Ink' })).toBeTruthy();
    const go = screen.getByRole('button', { name: 'Repeat it' });
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
    click('Keep it as it is');
    const kept = listPatterns()[0];
    expect(kept?.basedOn?.tutorial).toBe('eight-fold-star-and-cross');
    expect(kept?.tutorial.title).toBe('My Eight-fold star and cross');
    expect(kept?.tutorial.credits.at(-1)?.note).toMatch(/Drawn along/);
    expect(
      screen.getByRole('link', { name: 'Play it' }).getAttribute('href'),
    ).toBe(`#/mine/${kept?.id}`);
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
    // The tile's sides lie on lines already drawn, but it is not marked;
    // the point-only step 8 waits for step 7.
    expect(ticked()).toContain('2');
    expect(ticked()).not.toContain('8');
    expect(ticked()).not.toContain('9');
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
    click('Keep my board');
    expect(current()).toBe('4');
    expect(ticked()).toEqual(['1', '2', '3']);
    expect(document.querySelectorAll('.editor-drawing .el.extra')).toHaveLength(
      1,
    );
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
      screen.getByText(/Start at 1: put the pen down there, then click 2/),
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
    click('Repeat it');
    click('Keep it as it is');
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

  it('inks a stroke along the tile’s edge where it is drawn, and shows every dot without hovering', () => {
    act(() => {
      window.location.hash = '#/alhambra-comares-bones/draw';
    });
    render(<App entries={[{ id: 'alhambra-comares-bones', json: bones }]} />);
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
    // The dots to start from show before the pen is down.
    expect(inkBoard().querySelectorAll('.pen-dot').length).toBeGreaterThan(20);
    // A stroke along the top-left side of the tile.
    clickAt(-1, 3);
    clickAt(0, 4);
    const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
    const at = [...inkBoard().querySelectorAll('line.ink-piece.inked')].map(
      (l) => ['x1', 'y1', 'x2', 'y2'].map((k) => Number(l.getAttribute(k))),
    );
    expect(
      at.some(
        ([x1 = 0, y1 = 0, x2 = 0, y2 = 0]) =>
          (near(x1, -1) && near(y1, 3) && near(x2, 0) && near(y2, 4)) ||
          (near(x2, -1) && near(y2, 3) && near(x1, 0) && near(y1, 4)),
      ),
    ).toBe(true);
    // Inking top-left inks ONLY that stroke: exactly 1 line, no phantom arrows on opposite edges
    expect(at).toHaveLength(1);
    // Connecting to (1, 3) completes the top knob and does not ink arrow lines on left or right
    clickAt(1, 3);
    const at2 = [...inkBoard().querySelectorAll('line.ink-piece.inked')];
    expect(at2).toHaveLength(2);
  });

  it('inks across the middle circle even when later construction steps were skipped', () => {
    act(() => {
      window.location.hash = '#/alhambra-comares-bones/draw';
    });
    render(<App entries={[{ id: 'alhambra-comares-bones', json: bones }]} />);
    // Draw only steps 1 to 4, skipping step 5 (diagonals) and step 6 (tile)
    for (let i = 0; i < 4; i++) {
      click('Draw it for me');
      click('Next');
    }
    // Jump straight to Ink
    click('Ink');
    // Connect (-1, -1) to (1, 1) across the middle circle
    clickAt(-1, -1);
    clickAt(1, 1);
    const inked = [...inkBoard().querySelectorAll('line.ink-piece.inked')];
    expect(inked.length).toBeGreaterThanOrEqual(1);
  });

  it('repeats the tile by hand, colours the wall, and keeps both', () => {
    openAlong();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    click('Ink it for me');
    click('Repeat it');
    const wall = () => screen.getByRole('img', { name: 'Your wall' });
    const ghosts = () => wall().querySelectorAll('.ghost');
    const placed = () => wall().querySelectorAll('.copy').length - 1;
    // Four ghosts round a square tile; a click on one places a copy there.
    expect(ghosts()).toHaveLength(4);
    fireEvent.click(ghosts()[0] as Element);
    expect(placed()).toBe(1);
    expect(ghosts()).toHaveLength(6);
    // Undo and Redo the placing; Fill the wall for me lays many.
    click('Undo');
    expect(placed()).toBe(0);
    click('Redo');
    expect(placed()).toBe(1);
    click('Fill the wall for me');
    expect(placed()).toBeGreaterThan(4);
    // Erase takes one away.
    const before = placed();
    click('Erase');
    fireEvent.click(wall().querySelectorAll('.copy-area')[2] as Element);
    expect(placed()).toBe(before - 1);
    // Colour it: the wall's pieces are found and filled by their kind.
    click('Color it');
    const pieces = () => [...wall().querySelectorAll('.wall-piece')];
    const star = () =>
      pieces().filter((p) => p.getAttribute('data-type') !== '-1');
    expect(star().length).toBeGreaterThan(4);
    const targetType = star()[0]?.getAttribute('data-type');
    const sameKind = () =>
      pieces().filter((p) => p.getAttribute('data-type') === targetType);
    const initialFills = sameKind().map((p) => p.getAttribute('fill'));
    expect(new Set(initialFills).size).toBe(1);

    // A click on a piece chooses its kind: the colours for it open.
    fireEvent.click(star()[0] as Element);
    expect(document.querySelector('.along-colors .chooser')).toBeTruthy();
    fireEvent.click(
      document.querySelectorAll('.along-colors .swatch-button')[2] as Element,
    );

    // Recolours every piece of that kind.
    const recolouredFills = sameKind().map((p) => p.getAttribute('fill'));
    expect(new Set(recolouredFills).size).toBe(1);
    expect(recolouredFills[0]).not.toBe(initialFills[0]);

    // Keeping twice updates one pattern, and its colours are its design.
    click('Keep it');
    click('Keep it');
    expect(listPatterns()).toHaveLength(1);
    const kept = listPatterns()[0];
    expect(kept?.tutorial.title).toBe('My Eight-fold star and cross');
    expect(kept?.tutorial.title).not.toMatch(/ 2$/);
    const designs = listDesigns().filter(
      (d) => d.tutorial === `mine/${kept?.id}`,
    );
    expect(designs).toHaveLength(1);
    expect(designs[0]?.name).toBe('My Eight-fold star and cross');
    expect(designs[0]?.name).not.toMatch(/ 2$/);
    expect(designs[0]?.coloring).toEqual(kept?.wall?.coloring);
    expect(kept?.wall?.copies).toHaveLength(before - 1);
    expect(kept?.wall?.coloring?.palette).toBeTruthy();
    // Coming back finds the wall as it was.
    cleanup();
    openAlong();
    expect(
      document.querySelector('.along-dot[aria-current="step"]')?.textContent,
    ).toBe('Color');
    expect(
      screen.getByRole('img', { name: 'Your wall' }).querySelectorAll('.copy')
        .length - 1,
    ).toBe(before - 1);
  });

  it('opens the colour chooser on clicking a piece of the colour board and recolours every piece of that kind', () => {
    openAlong();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    click('Ink it for me');
    click('Repeat it');
    const wall = () => screen.getByRole('img', { name: 'Your wall' });
    const ghosts = () => wall().querySelectorAll('.ghost');
    fireEvent.click(ghosts()[0] as Element);
    click('Color it');
    const pieces = () => [...wall().querySelectorAll('.wall-piece')];
    const firstPiece = pieces().find(
      (p) => Number(p.getAttribute('data-type')) >= 0,
    );
    const kind = firstPiece?.getAttribute('data-type');
    const ofKind = () =>
      pieces().filter((p) => p.getAttribute('data-type') === kind);
    expect(ofKind().length).toBeGreaterThan(1);
    const beforeFills = ofKind().map((p) => p.getAttribute('fill'));
    expect(new Set(beforeFills).size).toBe(1);

    // Clicking a piece on the colour board opens the chooser
    fireEvent.click(ofKind()[0] as Element);
    expect(document.querySelector('.along-colors .chooser')).toBeTruthy();

    // Choosing a swatch recolours every piece of that kind
    const swatches = document.querySelectorAll('.along-colors .swatch-button');
    fireEvent.click(swatches[3] as Element);
    const afterFills = ofKind().map((p) => p.getAttribute('fill'));
    expect(new Set(afterFills).size).toBe(1);
    expect(afterFills[0]).not.toBe(beforeFills[0]);
  });

  it('makes one pattern and one design, not My … 2, when Keep it is pressed twice', () => {
    openAlong();
    for (let i = 0; i < 6; i++) {
      click('Draw it for me');
      click(i < 5 ? 'Next' : 'Ink it');
    }
    click('Ink it for me');
    click('Repeat it');
    click('Color it');
    click('Keep it');
    click('Keep it');
    const patterns = listPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.tutorial.title).toBe('My Eight-fold star and cross');
    expect(patterns[0]?.tutorial.title).not.toMatch(/ 2$/);
    const designs = listDesigns().filter(
      (d) => d.tutorial === `mine/${patterns[0]?.id}`,
    );
    expect(designs).toHaveLength(1);
    expect(designs[0]?.name).toBe('My Eight-fold star and cross');
    expect(designs[0]?.name).not.toMatch(/ 2$/);
  });

  it('snaps a dropped copy to a place where it joins up, and leaves it loose otherwise', () => {
    const cell = {
      origin: { x: -1, y: -1 },
      u: { x: 2, y: 0 },
      v: { x: 0, y: 2 },
      corners: [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ],
      area: 4,
    };
    const copies = [{ at: { x: 2, y: 0 } }];
    // Near (0, 2), within a sixth of the tile: it snaps there.
    expect(dropAt(cell, copies, 0, { x: 0.2, y: 2.1 })).toEqual({ x: 0, y: 2 });
    // Far from any place: it stays where it was dropped.
    const loose = { x: 0.9, y: 1.1 };
    expect(dropAt(cell, copies, 0, loose)).toEqual(loose);
    expect(snapped(cell, loose)).toBe(false);
    // Never onto the first tile or another copy.
    expect(
      dropAt(cell, [...copies, { at: { x: 5, y: 5 } }], 1, { x: 2.1, y: 0 }),
    ).toEqual({ x: 2.1, y: 0 });
  });

  it('shows dotted preview lines while drawing a polygon and closes on clicking the first point', () => {
    openAlong();
    // Step 1: compass circle through A
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    // Step 2: horizontal and vertical lines to create corner crossings
    tool('Ruler');
    clickAt(0, 0);
    clickAt(1, 0);
    tool('Square to');
    clickAt(-0.5, 0);
    clickAt(0, 0);

    // Pick Polygon tool
    tool('Polygon');
    const board = inkBoard();

    // Click 1st corner at (1, 0)
    clickAt(1, 0);
    expect(board.querySelectorAll('.polygon-band:not(.rubber)')).toHaveLength(0);

    // Click 2nd corner at (0, 1)
    clickAt(0, 1);
    expect(board.querySelectorAll('.polygon-band:not(.rubber)')).toHaveLength(1);

    // Click 3rd corner at (-1, 0)
    clickAt(-1, 0);
    expect(board.querySelectorAll('.polygon-band:not(.rubber)')).toHaveLength(2);

    // Move pointer near the first corner (1, 0) to check closing indication
    const [vx = 0, vy = 0, vw = 1, vh = 1] = (board.getAttribute('viewBox') ?? '')
      .split(' ')
      .map(Number);
    const s = Math.min(400 / vw, 400 / vh);
    fireEvent.pointerMove(board, {
      clientX: (1 - vx) * s + (400 - vw * s) / 2,
      clientY: (0 - vy) * s + (400 - vh * s) / 2,
    });
    expect(board.querySelector('.target.closing')).toBeTruthy();
    expect(board.querySelector('.polygon-band.rubber.closing')).toBeTruthy();

    // Click 1st corner again to close the polygon
    clickAt(1, 0);

    // Once closed, polygon targets and preview bands are cleared
    expect(board.querySelectorAll('.polygon-band')).toHaveLength(0);
    expect(board.querySelectorAll('.polygon-preview')).toHaveLength(0);
  });
});

