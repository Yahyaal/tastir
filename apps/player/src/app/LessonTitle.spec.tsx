import { render, screen } from '@testing-library/react';
import rosette from '@tutorials/twelve-fold-rosette-mian.json';
import { parseTutorial } from '@tastir/schema';
import { LessonTitle, referenceOf, stepSources } from './LessonTitle';
import drawing from '@tutorials/alhambra-arrayanes-squares.json';
import wheel from '@tutorials/kurt-eight-fold-zellige.json';

const tutorial = parseTutorial(rosette);

describe('the lesson title', () => {
  it('shows the short name, the subtitle and the reference to check against', () => {
    render(<LessonTitle tutorial={tutorial} />);
    const name = screen.getByRole('heading', { level: 1 });
    expect(name.textContent).toBe('Twelve-fold rosette');
    expect(name.title).toBe(tutorial.title);
    expect(screen.getByText('Samira Mian’s construction')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Tutorial: Samira Mian/ });
    expect(link.getAttribute('href')).toBe(
      'https://www.youtube.com/watch?v=5ocdSaE9tFg',
    );
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('prefers the drawing tutorial when a finished photograph precedes it', () => {
    const source = tutorial.credits[0];
    const reordered = {
      ...tutorial,
      credits: [
        {
          source: 'Finished panel photo',
          kind: 'photo' as const,
          url: 'https://example.com/photo',
        },
        ...tutorial.credits,
      ],
    };
    expect(referenceOf(reordered)).toEqual(source);
    render(<LessonTitle tutorial={reordered} prefix="Draw along: " />);
    expect(
      screen
        .getByRole('link', { name: /Tutorial: Samira Mian/ })
        .getAttribute('href'),
    ).toBe(source?.url);
  });

  it('labels a finished drawing as a reference rather than a drawing tutorial', () => {
    render(<LessonTitle tutorial={parseTutorial(drawing)} />);
    expect(
      screen.getByRole('link', { name: /Drawing reference: Brian Wichmann/ }),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Tutorial:/ })).toBeNull();
  });

  it('links sourced wheel steps to the PDF without claiming the added repeat', () => {
    const source = parseTutorial(wheel);
    expect(stepSources(source, 17)[0]?.url).toBe(
      'https://static.showit.co/file/yEZKK6D_ReWIuU5g0gIHyw/141862/8fold_zellige.pdf',
    );
    expect(stepSources(source, 18)).toEqual([]);
  });

  it('finds the sources that cover a step', () => {
    expect(stepSources(tutorial, 2).map((c) => c.creator)).toEqual([
      'Samira Mian',
    ]);
    expect(stepSources(tutorial, 999)).toEqual([]);
  });
});
