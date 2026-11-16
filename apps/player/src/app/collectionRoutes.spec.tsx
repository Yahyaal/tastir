import { cleanup, render, screen } from '@testing-library/react';
import App from './app';

beforeEach(() => {
  window.sessionStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});
it.each(['#collection', '#/collection', '#%63ollection'])(
  'opens %s as the library and focuses the collection',
  (hash) => {
    window.history.replaceState(null, '', hash);
    render(<App entries={[]} />);
    const heading = screen.getByRole('heading', {
      name: 'The patterns',
    });
    expect(screen.queryByText(/There is no tutorial called/)).toBeNull();
    expect(document.activeElement).toBe(heading);
  },
);
