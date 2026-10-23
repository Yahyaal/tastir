import { cleanup, render } from '@testing-library/react';
import { sentencesOf, StepText } from './StepText';

afterEach(cleanup);

describe('a step’s text', () => {
  it('splits into sentences, but not at a colon or a decimal point', () => {
    expect(
      sentencesOf(
        'Halve the angle: the 67.5° line meets the top at T. Join the top and left points. “Mark” Z.',
      ),
    ).toEqual([
      'Halve the angle: the 67.5° line meets the top at T.',
      'Join the top and left points.',
      '“Mark” Z.',
    ]);
  });

  it('is a list when it has several sentences, and plain text otherwise', () => {
    const many = render(<StepText text="Rule a line. Draw a circle." />);
    expect(many.container.querySelectorAll('ol > li')).toHaveLength(2);
    cleanup();
    const one = render(<StepText text="Draw a circle." />);
    expect(one.container.querySelector('ol')).toBeNull();
    expect(one.container.textContent).toBe('Draw a circle.');
  });

  it('numbers only the actions; what is on the board is an unnumbered note', () => {
    const view = render(
      <StepText text="Draw a circle with centre C through U. It crosses line FE at V and W. Draw a vertical line through V." />,
    );
    const items = [...view.container.querySelectorAll('li')];
    expect(items.map((li) => [li.className, li.getAttribute('value')])).toEqual(
      [
        ['', '1'],
        ['note', null],
        ['', '2'],
      ],
    );
  });
});
