import { render, screen } from '@testing-library/react';
import { Plan } from './Plan';

describe('the plan page', () => {
  it('shows the decisions, then asks for an OK on phase 1', () => {
    render(<Plan />);
    expect(
      document.querySelectorAll('#decisions tbody tr').length,
    ).toBeGreaterThan(0);
    const ask = document.querySelectorAll('#phase-1 li.question');
    expect(ask).toHaveLength(1);
    expect(ask[0]?.querySelectorAll('.choices button').length).toBe(2);
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
