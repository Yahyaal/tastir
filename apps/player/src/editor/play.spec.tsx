import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import App, { Play } from '../app/app';
import { listPatterns } from './patterns';

/** Moves the address to `hash`, as clicking a link would. */
function go(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

/** Clicks the drawing at a point of the frame (x right, y up). */
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

const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));
const tool = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('toolbar', { name: 'Tools' })).getByRole('button', {
      name: new RegExp(name),
    }),
  );

afterEach(() => {
  window.location.hash = '';
});

describe('from a copy to a played pattern', () => {
  it('copies the star and cross at step 3, draws an octagon and a tile, inks it and plays it', () => {
    const player = render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    click('Next');
    click('Next');
    click('Make my own copy from here');
    const id = listPatterns()[0]?.id ?? '';
    player.unmount();
    render(<App />);

    // The octagon through the eight points on the circle.
    tool('Polygon');
    const ring: [number, number][] = [0, 45, 90, 135, 180, 225, 270, 315].map(
      (a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)],
    );
    for (const [x, y] of [...ring, ring[0] as [number, number]]) clickAt(x, y);
    // The four sides of the square tile, touching the circle.
    tool('Square to');
    clickAt(-0.5, 0);
    clickAt(1, 0);
    tool('Square to');
    clickAt(-0.5, 0);
    clickAt(-1, 0);
    tool('Square to');
    clickAt(0, -0.5);
    clickAt(0, 1);
    tool('Square to');
    clickAt(0, -0.5);
    clickAt(0, -1);
    // The tile: its four corners, and the first again to close it.
    tool('Tile');
    for (const [x, y] of [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
      [1, 1],
    ] as const)
      clickAt(x, y);
    expect(document.querySelectorAll('.editor-step')).toHaveLength(9);
    expect(screen.getByText(/is the tile that repeats/)).toBeTruthy();

    // Ink one side of the octagon: symmetry inks all eight (copies and
    // whole lines are switched on by hand; both start off).
    click('Ink');
    fireEvent.click(screen.getByLabelText('Keep it symmetric'));
    fireEvent.click(screen.getByLabelText('Whole lines between points'));
    clickAt(0.8536, 0.3536);
    expect(document.querySelectorAll('.ink-piece.inked')).toHaveLength(8);
    const play = screen.getByRole('link', { name: /Play/ });
    expect(play.getAttribute('href')).toBe(`#/mine/${id}`);

    // Played like any tutorial, opening at the wall: octagons and the
    // four-pointed stars between them.
    go(`#/mine/${id}`);
    expect(document.querySelector('.label')?.textContent).toBe('Color');
    expect(
      [...document.querySelectorAll('.piece-button')].map((b) =>
        b.getAttribute('aria-label'),
      ),
    ).toEqual(['Recolor every octagon', 'Recolor every star']);
    // And it can be saved as a design, like a library pattern.
    click('Save as my design');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Octagons' },
    });
    click('Save');
    expect(window.location.hash).toMatch(new RegExp(`^#/mine/${id}/design/`));
  });

  it('says what is missing when a pattern cannot be played yet', () => {
    const player = render(<Play json={example} />);
    click('Make my own copy from here');
    const id = listPatterns()[0]?.id ?? '';
    player.unmount();
    render(<App />);
    go(`#/mine/${id}`);
    expect(
      screen.getByRole('heading', {
        name: 'This pattern cannot be played yet',
      }),
    ).toBeTruthy();
    expect(screen.getByText(/Choose the tile first/)).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Open it in the editor' })
        .getAttribute('href'),
    ).toBe(`#/edit/${id}`);
  });
});
