import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './app';
import { UpcomingPatterns } from './UpcomingPatterns';
import { UPCOMING_PATTERNS } from './upcoming-patterns';

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
  it('keeps the historical Darb-e Imam target separate from the rectangular study', () => {
    const target = UPCOMING_PATTERNS.find(
      (p) => p.id === 'darb-e-imam-decagram',
    )!;
    expect(target.status).toBe('Researching');
    expect(target.source.name).toContain('Figure 3');
    expect(target.drawnUrl).toBeUndefined();
    expect(target.drawingSteps).toEqual([]);
    const { container } = render(<UpcomingPatterns />);
    const card = [...container.querySelectorAll('.upcoming-card')].find((c) =>
      c.textContent?.includes(target.title),
    )!;
    expect(card.textContent).toContain('Schematic ten-fold preview');
    expect(card.textContent).toContain(
      'Drawing instructions are still under research.',
    );
    expect(card.querySelector('.drawing-guide-toggle')).toBeNull();
  });
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
    within(viewer)
      .getByRole('button', { name: /Actual Resolution/ })
      .focus();
    fireEvent.error(full);
    expect(viewer.querySelector('.lightbox-img')).toBeNull();
    expect(
      within(viewer)
        .getByRole('tab', { name: /Blueprint/ })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(document.activeElement).toBe(
      within(viewer).getByRole('button', { name: 'Close inspection view' }),
    );
  });

  it('contains inspection keyboard focus and restores the card and page scrolling', () => {
    const { container } = render(<UpcomingPatterns />);
    const card = container.querySelector('.upcoming-card') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: /Blueprint/ }));
    const opener = card.querySelector(
      '.card-blueprint-interactive',
    ) as HTMLElement;
    opener.focus();
    const overflow = document.body.style.overflow;
    fireEvent.keyDown(opener, { key: 'Enter' });
    const viewer = screen.getByRole('dialog');
    expect(document.activeElement).toBe(
      within(viewer).getByRole('button', { name: 'Close inspection view' }),
    );
    expect(document.body.style.overflow).toBe('hidden');
    const controls = [
      ...viewer.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'),
    ];
    controls[controls.length - 1]!.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(controls[0]);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(controls[controls.length - 1]);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe(overflow);
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
