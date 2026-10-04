import { fireEvent, render, screen } from '@testing-library/react';
import { PATTERNS } from './data';
import { Review } from './Review';

describe('the overnight review page', () => {
  beforeEach(() => localStorage.clear());

  it('shows a card for every pattern, decisions first', () => {
    render(<Review />);
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    for (const p of PATTERNS) expect(titles).toContain(p.title);
    const decide = PATTERNS.filter((p) => p.status === 'decide');
    expect(titles.slice(0, decide.length)).toEqual(decide.map((p) => p.title));
  });

  it('links each pattern to the player and its pictures to the dev server', () => {
    render(<Review />);
    for (const p of PATTERNS) {
      const card = document.getElementById(p.id) as HTMLElement;
      expect(card.querySelector(`a[href="/#/${p.id}"]`)).toBeTruthy();
      for (const img of card.querySelectorAll('img'))
        expect(img.getAttribute('src')).toMatch(
          /^\/__review\/(renders|research)\//,
        );
    }
  });

  it('keeps typed answers and copies them as text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Review />);
    const first = PATTERNS.find((p) => p.status === 'decide');
    const box = screen.getAllByPlaceholderText(
      /Your answer/,
    )[0] as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'Keep it.' } });
    expect(
      JSON.parse(localStorage.getItem('tastir-review-answers') ?? '{}'),
    ).toEqual({
      [`${first?.id}:0`]: 'Keep it.',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Copy my answers' }));
    await screen.findByRole('button', { name: 'Copied ✓' });
    expect(writeText.mock.calls[0]?.[0]).toContain('A: Keep it.');
  });
});
