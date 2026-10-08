import { act, render, screen } from '@testing-library/react';
import App from './app';
import { UpcomingPatterns } from './UpcomingPatterns';

/** Moves the address to `hash`, as clicking a link would. */
function go(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

afterEach(() => {
  window.location.hash = '';
});

describe('Upcoming patterns page', () => {
  it('renders all 24 cataloged patterns by default', () => {
    render(<UpcomingPatterns />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain(
      'Upcoming Patterns & Masterwork Queue',
    );
    expect(screen.getAllByText('24').length).toBeGreaterThan(0);
    // Verify specific key masterworks exist
    expect(
      screen.getByText('Stellated Twelvefold Rosette in a Hexagonal Arrangement'),
    ).toBeDefined();
    expect(
      screen.getByText('Darb-e Imam Decagram & Girih Tiling'),
    ).toBeDefined();
  });

  it('filters patterns when clicking symmetry fold chips', () => {
    render(<UpcomingPatterns />);
    const tenFoldChip = screen.getByRole('button', { name: '10-fold (Girih)' });
    act(() => {
      tenFoldChip.click();
    });
    // Should show 10-fold masterworks
    expect(
      screen.getByText('Darb-e Imam Decagram & Girih Tiling'),
    ).toBeDefined();
    // Non-10-fold masterworks should be hidden
    expect(
      screen.queryByText('Stellated Twelvefold Rosette in a Hexagonal Arrangement'),
    ).toBeNull();
  });

  it('filters patterns by search input', () => {
    render(<UpcomingPatterns />);
    const input = screen.getByLabelText('Search upcoming patterns');
    act(() => {
      input.focus();
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeInputValueSetter?.call(input, 'Humayun');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(
      screen.getByText('Humayun’s Tomb Eight-Fold Jali Lattice'),
    ).toBeDefined();
    expect(screen.queryByText('Darb-e Imam Decagram & Girih Tiling')).toBeNull();
  });

  it('renders upcoming page when route is #/upcoming in App', async () => {
    go('#/upcoming');
    render(<App />);
    const heading = await screen.findByRole('heading', {
      name: 'Upcoming Patterns & Masterwork Queue',
    });
    expect(heading).toBeDefined();
  });
});
