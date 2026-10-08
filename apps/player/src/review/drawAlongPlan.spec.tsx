import { render, screen } from '@testing-library/react';
import { DrawAlongPlan } from './DrawAlongPlan';

describe('the draw-along plan page', () => {
  it('shows its mock-ups and the work in order', () => {
    render(<DrawAlongPlan />);
    expect(
      screen.getByRole('heading', { name: 'Plan: draw along' }),
    ).toBeTruthy();
    expect(document.querySelectorAll('img.plan-shot')).toHaveLength(3);
    expect(document.querySelectorAll('.plan-phases li').length).toBeGreaterThan(
      0,
    );
  });
});
