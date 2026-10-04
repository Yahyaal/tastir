import { fireEvent, render, screen } from '@testing-library/react';
import { PATTERNS, QUESTIONS } from './data';
import { Review } from './Review';

describe('the review page', () => {
  beforeEach(() => localStorage.clear());

  it('asks its questions first, numbered in order', () => {
    render(<Review />);
    const items = document.querySelectorAll('.question');
    expect(items).toHaveLength(QUESTIONS.length);
    QUESTIONS.forEach((q, i) => {
      expect(items[i]?.textContent).toContain(`Q${i + 1}`);
      expect(items[i]?.textContent).toContain(q.text);
    });
  });

  it('points every question at a pattern card, and every waiting card back at its questions', () => {
    render(<Review />);
    for (const q of QUESTIONS)
      expect(document.getElementById(q.card)).toBeTruthy();
    for (const p of PATTERNS.filter((x) => x.status === 'decide')) {
      const card = document.getElementById(p.id) as HTMLElement;
      expect(card.querySelector('a[href^="#q-"]')).toBeTruthy();
    }
  });

  it('links each pattern to the player and its pictures to the dev server', () => {
    render(<Review />);
    for (const p of PATTERNS) {
      const card = document.getElementById(p.id) as HTMLElement;
      expect(card.querySelector(`a[href="/#/${p.id}"]`)).toBeTruthy();
    }
    for (const img of document.querySelectorAll('img'))
      expect(img.getAttribute('src')).toMatch(
        /^\/__review\/(renders|research)\//,
      );
  });

  it('records a one-click choice and copies the answers as text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Review />);
    const first = QUESTIONS[0];
    const choice = first?.choices?.[0] as string;
    fireEvent.click(
      screen.getAllByRole('button', { name: choice })[0] as HTMLElement,
    );
    expect(
      JSON.parse(localStorage.getItem('tastir-review-answers') ?? '{}'),
    ).toEqual({
      [first?.id as string]: choice,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Copy my answers' }));
    await screen.findByRole('button', { name: 'Copied ✓' });
    expect(writeText.mock.calls[0]?.[0]).toContain(
      `Q1. ${first?.text}\nA: ${choice}`,
    );
  });
});
