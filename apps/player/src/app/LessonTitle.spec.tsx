import { render, screen } from '@testing-library/react';
import rosette from '@tutorials/twelve-fold-rosette-mian.json';
import { parseTutorial } from '@tastir/schema';
import { LessonTitle, stepSources } from './LessonTitle';

const tutorial = parseTutorial(rosette);

describe('the lesson title', () => {
  it('shows the short name, the subtitle and the reference to check against', () => {
    render(<LessonTitle tutorial={tutorial} />);
    const name = screen.getByRole('heading', { level: 1 });
    expect(name.textContent).toBe('Twelve-fold rosette');
    expect(name.title).toBe(tutorial.title);
    expect(screen.getByText('Samira Mian’s construction')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Reference: Samira Mian/ });
    expect(link.getAttribute('href')).toBe(
      'https://www.samiramian.uk/twelvefoldrosette',
    );
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('finds the sources that cover a step', () => {
    expect(stepSources(tutorial, 2).map((c) => c.creator)).toEqual([
      'Samira Mian',
    ]);
    expect(stepSources(tutorial, 999)).toEqual([]);
  });
});
