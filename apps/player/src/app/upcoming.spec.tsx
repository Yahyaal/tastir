import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
  it('replaces missing private card pictures with the blueprint and retains the source', () => {
    const { container } = render(<UpcomingPatterns />);
    const images = [
      ...container.querySelectorAll('img[src^="/__review/research/"]'),
    ];
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const card = image.closest('.upcoming-card')!;
      fireEvent.error(image);
      expect(image.isConnected).toBe(false);
      expect(card.querySelector('.card-blueprint-interactive')).not.toBeNull();
      const photo = within(card as HTMLElement).getByRole('button', {
        name: /Monument Photo/,
      });
      fireEvent.click(photo);
      expect(card.querySelector('img.card-media-img')).toBeNull();
      expect(
        within(card as HTMLElement).getByRole('link', { name: 'its source' }),
      ).toBeTruthy();
    }
  });

  it('replaces missing inspection pictures with the blueprint', () => {
    const { container } = render(<UpcomingPatterns />);
    const image = container.querySelector('img[src^="/__review/research/"]')!;
    fireEvent.click(image.closest('[role="button"]')!);
    const viewer = screen.getByRole('dialog');
    const full = viewer.querySelector('.lightbox-img')!;
    expect(full).not.toBeNull();
    fireEvent.error(full);
    expect(viewer.querySelector('.lightbox-img')).toBeNull();
    expect(
      within(viewer)
        .getByRole('tab', { name: /Blueprint/ })
        .getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('renders all 24 cataloged patterns by default', () => {
    render(<UpcomingPatterns />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain(
      'Upcoming Patterns & Masterwork Queue',
    );
    expect(screen.getAllByText('24').length).toBeGreaterThan(0);
    // Verify specific key masterworks exist
    expect(
      screen.getByText(
        'Stellated Twelvefold Rosette in a Hexagonal Arrangement',
      ),
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
      screen.queryByText(
        'Stellated Twelvefold Rosette in a Hexagonal Arrangement',
      ),
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
    expect(
      screen.queryByText('Darb-e Imam Decagram & Girih Tiling'),
    ).toBeNull();
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
