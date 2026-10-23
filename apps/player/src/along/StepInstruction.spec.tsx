import { cleanup, render, screen } from '@testing-library/react';
import { StepInstruction } from './StepInstruction';

afterEach(cleanup);

it('shows the heading and each sentence of the step on its own line', () => {
  render(
    <StepInstruction head="Step 2" text="Rule the vertical. Draw a circle." />,
  );
  expect(screen.getByRole('heading', { name: 'Step 2' })).toBeTruthy();
  expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
    'Rule the vertical.',
    'Draw a circle.',
  ]);
});
