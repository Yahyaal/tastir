import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('shows the placeholder title', () => {
    const { getByRole } = render(<App />);
    expect(getByRole('heading', { name: 'Tastir' })).toBeTruthy();
  });
});
