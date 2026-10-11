import { fireEvent, render, screen, within } from '@testing-library/react';
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

it('changes family and finish directly, showing only that family’s presets', () => {
  render(<Finish />);
  expect(screen.queryByRole('combobox')).toBeNull();
  for (const preset of JALI_FINISHES) {
    fireEvent.click(
      screen.getByRole('button', {
        name:
          preset.material === 'stone'
            ? 'Stone'
            : preset.material === 'wood'
              ? 'Wood'
              : 'Metal',
      }),
    );
    const finishes = screen.getByRole('group', { name: 'Framework finishes' });
    expect(
      within(finishes)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(
      JALI_FINISHES.filter((p) => p.material === preset.material).map(
        (p) => p.name,
      ),
    );
    fireEvent.click(
      within(finishes).getByRole('button', { name: preset.name }),
    );
    expect(appearance()).toEqual({
      material: preset.material,
      finish: preset.finish,
      framework: preset.color,
      background: DEFAULT_JALI.background,
    });
    expect(
      within(finishes)
        .getByRole('button', { name: preset.name })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  }
});

it('opens the native picker in one click without a modal and keeps custom wood colors when clicking Wood again', () => {
  const showPicker = vi.fn();
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'showPicker',
  );
  Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
    configurable: true,
    value: showPicker,
  });
  try {
    render(<Finish />);
    fireEvent.click(screen.getByRole('button', { name: 'Wood' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Custom framework color',
      }),
    );
    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(
      screen.getByLabelText('Framework color', { selector: 'input' }),
      { target: { value: '#864b31' } },
    );
    expect(appearance()).toMatchObject({
      material: 'wood',
      finish: 'custom',
      framework: '#864b31',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Wood' }));
    expect(appearance()).toMatchObject({
      material: 'wood',
      finish: 'custom',
      framework: '#864b31',
    });
    expect(
      screen
        .getByRole('button', { name: 'Custom framework color' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  } finally {
    if (descriptor)
      Object.defineProperty(
        HTMLInputElement.prototype,
        'showPicker',
        descriptor,
      );
    else Reflect.deleteProperty(HTMLInputElement.prototype, 'showPicker');
  }
});

it('chooses background presets immediately, keeps custom colors independent, and resets', () => {
  render(<Finish />);
  fireEvent.click(screen.getByRole('button', { name: 'Wood' }));
  fireEvent.click(screen.getByRole('button', { name: 'Walnut' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Night blue background' }),
  );
  expect(appearance()).toMatchObject({
    material: 'wood',
    finish: 'walnut',
    framework: '#593d2b',
    background: '#234a79',
  });
  fireEvent.change(
    screen.getByLabelText('Background color', { selector: 'input' }),
    { target: { value: '#314253' } },
  );
  expect(appearance()).toMatchObject({
    finish: 'walnut',
    framework: '#593d2b',
    background: '#314253',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Jali finish' }));
  expect(appearance()).toEqual(DEFAULT_JALI);
});
