import { fireEvent, render, screen } from '@testing-library/react';
import { PATTERNS, PROGRESS, QUESTIONS } from './data';
import { LIBRARY } from '../app/library';
import { Review } from './Review';

describe('the review page', () => {
  it('shows the progress first: now, done, still to do, and waiting on the owner', () => {
    render(<Review />);
    const progress = document.querySelector('#progress') as HTMLElement;
    expect(progress).toBeTruthy();
    expect(progress.querySelector('.progress-now li')?.textContent).toContain(
      PROGRESS.now.title,
    );
    expect(progress.querySelectorAll('.progress-done li')).toHaveLength(
      PROGRESS.done.length,
    );
    expect(progress.querySelectorAll('.progress-next li')).toHaveLength(
      PROGRESS.next.length,
    );
    const order = [...document.querySelectorAll('h2.group')].map(
      (h) => h.textContent,
    );
    // The questions come first, then where the work stands.
    expect(order.slice(0, 2)).toEqual(['Questions for you', 'Progress']);
  });

  it('says so when there are no questions', () => {
    render(<Review />);
    if (QUESTIONS.length === 0)
      expect(screen.getByText(/No questions for you right now/)).toBeTruthy();
  });

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

  it('scrolls to a card on this page instead of leaving it', () => {
    window.location.hash = '#/review';
    render(<Review />);
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };
    const link = [...document.querySelectorAll('a')].find(
      (a) => a.getAttribute('href') === '#decide-list',
    ) as HTMLAnchorElement;
    fireEvent.click(link);
    expect(window.location.hash).toBe('#/review');
    expect(scrolled[0]?.id).toBe('decide-list');
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

  it('links each tutorial to the player and its pictures to the dev server', () => {
    render(<Review />);
    const tutorials = new Set(LIBRARY.map((e) => e.id));
    for (const p of PATTERNS) {
      const card = document.getElementById(p.id) as HTMLElement;
      // Only a card that is a tutorial can open in the player.
      expect(!!card.querySelector(`a[href="/#/${p.id}"]`)).toBe(
        tutorials.has(p.id),
      );
    }
    for (const img of document.querySelectorAll('img'))
      expect(img.getAttribute('src')).toMatch(
        /^\/__review\/(renders|research)\//,
      );
  });

  it.skipIf(QUESTIONS.length === 0)(
    'records a one-click choice and copies the answers as text',
    async () => {
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
    },
  );
});
