import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../app/app';
import { listPatterns } from './patterns';

afterEach(() => {
  window.location.hash = '';
});

describe('new pattern', () => {
  it(
    'opens the editor from the home page with only O and A, and says what to click first',
    { timeout: 30_000 },
    () => {
      render(<App entries={[]} />);
      fireEvent.click(screen.getByRole('button', { name: 'New pattern' }));
      const id = listPatterns()[0]?.id ?? '';
      expect(window.location.hash).toBe(`#/edit/${id}`);
      act(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      expect(document.querySelectorAll('.editor-step')).toHaveLength(0);
      expect(
        screen.getByText(/Start with the compass: click O, then A/),
      ).toBeTruthy();
      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveProperty(
        'value',
        'My pattern',
      );
    },
  );

  // Slow in the full parallel run, like the other home page tests.
  it(
    'is also offered beside my patterns once there are some',
    { timeout: 30_000 },
    () => {
      render(<App entries={[]} />);
      fireEvent.click(screen.getByRole('button', { name: 'New pattern' }));
      act(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      act(() => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      // The pattern is in Your work's row, and New pattern stays in the header.
      expect(
        within(screen.getByRole('region', { name: 'Your work' })).getByRole(
          'heading',
          { name: 'My pattern' },
        ),
      ).toBeTruthy();
      expect(
        document.querySelector('.masthead .new-pattern button')?.textContent,
      ).toBe('New pattern');
    },
  );
});
