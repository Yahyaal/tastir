import { fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import App from './app';

const next = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
const back = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
const label = () => document.querySelector('.label')?.textContent;

describe('the player', () => {
  it('starts at step 1 with its text, and Back disabled', () => {
    render(<App />);
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
    const { container } = render(<App />);
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
    const { container } = render(<App />);
    for (let i = 0; i < 3; i++) next(); // step 4 joins E, N, W and S
    const named = [
      ...container.querySelectorAll('text.point-name.highlighted'),
    ].map((t) => t.textContent);
    expect(named).toEqual(['E', 'N', 'W', 'S']);
  });

  it('steps through all six steps, the ink and the wall, and back', () => {
    const { container } = render(<App />);
    const seen = [label()];
    for (let i = 0; i < 7; i++) {
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
      'Wall',
    ]);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(
      screen.getByText(
        'Each tile holds one star and one cross. Laid edge to edge, the tiles make the wall.',
      ),
    ).toBeTruthy();
    // Every copy of the cell has one star and one cross.
    const pieces = container.querySelectorAll('polygon.piece');
    expect(pieces.length % 2).toBe(0);
    expect(new Set([...pieces].map((p) => p.getAttribute('fill'))).size).toBe(
      2,
    );
    back();
    expect(label()).toBe('Ink');
    expect(container.querySelectorAll('.ink line')).toHaveLength(16);
  });

  it('moves with the arrow keys', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(label()).toBe('Step 2 of 6');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(label()).toBe('Step 1 of 6');
  });

  it('shows the engine error for a tutorial it cannot play', () => {
    const broken = structuredClone(example) as {
      steps: { create: Record<string, unknown> }[];
    };
    (broken.steps[1] as { create: Record<string, unknown> }).create.E = {
      point: { meet: ['c', 'h'] },
    };
    render(<App json={broken} />);
    expect(
      screen.getByText(/Step 2, element "E": 2 crossings of "c" and "h" match/),
    ).toBeTruthy();
  });
});
