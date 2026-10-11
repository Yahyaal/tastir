import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { DEFAULT_JALI, JALI_FINISHES } from './jali';
import { JaliControls } from './JaliControls';

function Finish() {
  const [appearance, onChange] = useState(DEFAULT_JALI);
  return (
    <>
      <JaliControls appearance={appearance} onChange={onChange} />
      <output data-testid="appearance">{JSON.stringify(appearance)}</output>
    </>
  );
}
const appearance = () =>
  JSON.parse(screen.getByTestId('appearance').textContent!);

it('offers three families and only their own finishes, preserving the background', () => {
  render(<Finish />);
  const material = screen.getByRole('combobox', { name: 'Material' });
  expect(
    [...material.querySelectorAll('option')].map((o) => o.textContent),
  ).toEqual(['Stone', 'Wood', 'Metal']);
  for (const preset of JALI_FINISHES) {
    fireEvent.change(material, { target: { value: preset.material } });
    const finish = screen.getByRole('combobox', { name: 'Finish' });
    expect([...finish.querySelectorAll('option')].map((o) => o.value)).toEqual([
      ...JALI_FINISHES.filter((p) => p.material === preset.material).map(
        (p) => p.finish,
      ),
      'custom',
    ]);
    fireEvent.change(finish, { target: { value: preset.finish } });
    expect(appearance()).toEqual({
      material: preset.material,
      finish: preset.finish,
      framework: preset.color,
      background: DEFAULT_JALI.background,
    });
  }
});

it('uses familiar swatches and native Any color, retains the family, and restores focus', () => {
  render(<Finish />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Material' }), {
    target: { value: 'metal' },
  });
  const opener = screen.getByRole('button', { name: 'Choose framework color' });
  opener.focus();
  fireEvent.click(opener);
  expect(screen.getByRole('dialog', { name: 'Framework color' })).toBeTruthy();
  const input = screen.getByLabelText('Framework color', {
    selector: 'input',
  }) as HTMLInputElement;
  expect(input.type).toBe('color');
  fireEvent.click(screen.getByRole('button', { name: 'Bronze (#a77b43)' }));
  expect(appearance().finish).toBe('bronze');
  fireEvent.change(input, { target: { value: '#864b31' } });
  expect(appearance()).toMatchObject({
    material: 'metal',
    finish: 'custom',
    framework: '#864b31',
  });
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(opener);
});

it('opens Custom color, keeps background independent and resets both colors and the finish', () => {
  render(<Finish />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Finish' }), {
    target: { value: 'custom' },
  });
  fireEvent.change(
    screen.getByLabelText('Framework color', { selector: 'input' }),
    {
      target: { value: '#864b31' },
    },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Choose background color' }),
  );
  fireEvent.change(
    screen.getByLabelText('Background color', { selector: 'input' }),
    {
      target: { value: '#234a79' },
    },
  );
  expect(appearance()).toMatchObject({
    framework: '#864b31',
    background: '#234a79',
    finish: 'custom',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset Jali finish' }));
  expect(appearance()).toEqual(DEFAULT_JALI);
});
