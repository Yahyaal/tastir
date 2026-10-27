import { render, screen } from '@testing-library/react';
import { WALL_STYLES } from './Wall';
import { WallControls } from './WallControls';

const controls = (styles?: (typeof WALL_STYLES)[number][]) =>
  render(
    <WallControls
      style="strapwork"
      onStyle={() => undefined}
      grout={1}
      onGrout={() => undefined}
      sample={() => null}
      {...(styles ? { styles } : {})}
    />,
  );

describe('the wall styles', () => {
  it('offers every style by default', () => {
    controls();
    expect(screen.getByRole('button', { name: 'Interlace' })).toBeTruthy();
  });

  it('leaves out interlace for a pattern whose bands cannot weave', () => {
    controls(WALL_STYLES.filter((s) => s !== 'interlace'));
    expect(screen.queryByRole('button', { name: 'Interlace' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Strapwork' })).toBeTruthy();
  });
});
