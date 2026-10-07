import { render, screen } from '@testing-library/react';
import { Plan } from './Plan';

describe('the plan page', () => {
  it('asks its questions first, with a choice for each', () => {
    render(<Plan />);
    const questions = document.querySelectorAll('#questions li.question');
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions)
      expect(q.querySelectorAll('.choices button').length).toBeGreaterThan(1);
  });

  it('draws its figures from real tutorials', () => {
    render(<Plan />);
    expect(screen.getByText(/Figure 5\./)).toBeTruthy();
    // The dependency figure marks the edited step and the steps it affects.
    expect(document.querySelector('.node.edited')).toBeTruthy();
    expect(document.querySelectorAll('.node.hit').length).toBeGreaterThan(0);
    // The construction drawings hold real circles and lines.
    expect(
      document.querySelectorAll('.plan-draw circle.old').length,
    ).toBeGreaterThan(0);
  });
});
