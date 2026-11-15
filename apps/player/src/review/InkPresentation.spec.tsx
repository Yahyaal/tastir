import { fireEvent, render, screen } from '@testing-library/react';
import { InkPresentation } from './InkPresentation';

describe('the ink research presentation', () => {
  beforeEach(() =>
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined),
  );
  afterEach(() => vi.restoreAllMocks());

  it('walks through the findings and distinguishes proposed work from completed work', () => {
    render(<InkPresentation />);
    expect(
      screen
        .getByRole('button', { name: '← Previous' })
        .hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } });
    expect(screen.getByText('Aligned: every line agrees.')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Go to slide' }), {
      target: { value: '7' },
    });
    expect(
      screen.getByRole('button', { name: 'Next →' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByText(
        /final palette choices and the teaching prototypes remain for review/,
      ),
    ).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1 }),
    );
  });

  it('isolates the actual unmatched strokes without changing the measured coverage', () => {
    render(<InkPresentation />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Go to slide' }), {
      target: { value: '4' },
    });
    expect(screen.getByText('96.87%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Differences only' }));
    const drawing = screen.getByRole('img');
    expect(drawing.querySelector('.ink-talk-shared')).toBeNull();
    expect(drawing.querySelector('.ink-talk-a')?.getAttribute('d')).not.toBe(
      '',
    );
    expect(drawing.querySelector('.ink-talk-b')?.getAttribute('d')).not.toBe(
      '',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Overlay' }));
    expect(drawing.querySelector('.ink-talk-shared')).toBeTruthy();
    expect(screen.getByText('95.96%')).toBeTruthy();
  });
});
