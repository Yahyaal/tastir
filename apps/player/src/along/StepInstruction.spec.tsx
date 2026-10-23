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

it('lists the ink a shape at a time, ticking what is done', () => {
  render(
    <StepInstruction
      head="Ink"
      text="Ink it all."
      parts={[
        { text: 'Ink the star.', done: true },
        { text: 'Ink the corner at K. It is a square.', done: false },
        { text: 'Ink the seams.', done: false },
      ]}
    />,
  );
  const items = screen.getAllByRole('listitem');
  expect(items.map((li) => li.className)).toEqual(['done', 'at', '']);
  expect(items[0]?.textContent).toMatch(/^✓Ink the star\./);
  expect(items[1]?.getAttribute('aria-current')).toBe('step');
  expect(screen.getByText('It is a square.').className).toBe('note');
});
