import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { DEFAULT_JALI } from './jali';
import { JaliControls } from './JaliControls';

function Finish() {
  const [appearance, onChange] = useState(DEFAULT_JALI);
  return <JaliControls appearance={appearance} onChange={onChange} />;
}

it('chooses colors inside the panel and changes RGB channels independently', () => {
  const { container } = render(<Finish />);
  expect(container.querySelector('input[type="color"]')).toBeNull();
  const button = screen.getByRole('button', { name: 'Choose framework color' });
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  const picker = screen.getByRole('group', { name: 'Framework color picker' });
  fireEvent.click(picker.querySelector('button[aria-label="Use #234a79"]')!);
  const input = screen.getByLabelText('Framework color') as HTMLInputElement;
  expect(input.value).toBe('#234a79');
  fireEvent.change(
    screen.getByRole('slider', { name: 'Framework color: Red' }),
    { target: { value: '255' } },
  );
  expect(input.value).toBe('#ff4a79');
  expect(
    (screen.getByLabelText('Background color') as HTMLInputElement).value,
  ).toBe(DEFAULT_JALI.background);
  fireEvent.keyDown(picker, { key: 'Escape' });
  expect(
    screen.queryByRole('group', { name: 'Framework color picker' }),
  ).toBeNull();
  expect(document.activeElement).toBe(button);
});

it('allows hex editing without applying incomplete or invalid colors', () => {
  render(<Finish />);
  const input = screen.getByLabelText('Background color') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '#12' } });
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const swatch = screen.getByRole('button', {
    name: 'Choose background color',
  });
  expect(swatch.style.backgroundColor).toBe('rgb(112, 141, 135)');
  fireEvent.change(input, { target: { value: '#AABBCC' } });
  expect(input.value).toBe('#aabbcc');
  expect(input.getAttribute('aria-invalid')).toBe('false');
  fireEvent.change(input, { target: { value: '#nope' } });
  fireEvent.blur(input);
  expect(input.value).toBe('#aabbcc');
  fireEvent.click(screen.getByRole('button', { name: 'Reset Jali finish' }));
  expect(input.value).toBe(DEFAULT_JALI.background);
});

it('updates the color editor when a material preset changes', () => {
  render(<Finish />);
  fireEvent.change(screen.getByLabelText('Framework color'), {
    target: { value: '#12' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Material' }), {
    target: { value: 'gold' },
  });
  expect(
    (screen.getByLabelText('Framework color') as HTMLInputElement).value,
  ).toBe('#d6ac46');
  expect(
    (screen.getByLabelText('Background color') as HTMLInputElement).value,
  ).toBe(DEFAULT_JALI.background);
});
