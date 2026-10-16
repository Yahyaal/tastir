import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import { addPattern, listPatterns } from '../editor/patterns';
import App from './app';
import { listDesigns } from './designs';

/** Every piece's fill on the wall, in order. */
const fills = () =>
  [...document.querySelectorAll('.wall .wall-piece')].map((p) =>
    p.getAttribute('fill'),
  );

function go(hash: string) {
  act(() => {
    window.location.hash = hash;
  });
}

/** Recolours, copies the share link and returns its address part. */
async function shareFrom(
  hash: string,
): Promise<{ hash: string; colored: (string | null)[] }> {
  go(hash);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Chefchaouen' }));
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Style' })).getByRole('button', {
      name: 'Strapwork',
    }),
  );
  const colored = fills();
  fireEvent.click(screen.getByRole('button', { name: 'Copy a share link' }));
  const input = await waitFor(() => screen.getByLabelText('Share link'));
  const link = (input as HTMLInputElement).value;
  expect(link).toMatch(/#\/shared\/[zj][\w-]+$/);
  cleanup();
  return { hash: link.slice(link.indexOf('#')), colored };
}

/** Another browser: nothing kept, then the link opened. */
async function openIn(hash: string) {
  window.localStorage.clear();
  go(hash);
  render(<App />);
  await waitFor(() => screen.getByText(/A pattern shared with you/));
}

afterEach(() => {
  window.location.hash = '';
});

describe('share links', () => {
  it('opens a library pattern with the same wall and colours elsewhere, and keeps a copy', async () => {
    const { hash, colored } = await shareFrom(
      '#/eight-fold-star-and-cross/result',
    );
    await openIn(hash);
    expect(document.querySelector('.label')?.textContent).toBe('Color');
    expect(fills()).toEqual(colored);
    expect(
      within(screen.getByRole('group', { name: 'Style' }))
        .getByRole('button', { name: 'Strapwork' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep a copy in this browser' }),
    );
    expect(listDesigns()).toHaveLength(1);
    expect(listDesigns()[0]?.tutorial).toBe('eight-fold-star-and-cross');
    expect(window.location.hash).toBe(
      `#/eight-fold-star-and-cross/design/${listDesigns()[0]?.id}`,
    );
  });

  it('carries a pattern of one’s own whole, so it opens where it was never made', async () => {
    const p = addPattern(parseTutorial(example));
    const { hash, colored } = await shareFrom(`#/mine/${p?.id}/result`);
    await openIn(hash);
    expect(listPatterns()).toEqual([]);
    expect(fills()).toEqual(colored);
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep a copy in this browser' }),
    );
    expect(listPatterns()).toHaveLength(1);
    expect(listDesigns()[0]?.tutorial).toBe(`mine/${listPatterns()[0]?.id}`);
  });

  it('says so when a link is broken', async () => {
    go('#/shared/jnot-a-pattern');
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/This share link cannot be read/)).toBeTruthy(),
    );
  });
});
