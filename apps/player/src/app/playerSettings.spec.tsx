import { StrictMode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  SharedPresentationShape,
  type SharedPresentation,
} from '@tastir/schema';
import { Play } from './Player';
import App from './app';
import { stagesOf, loadModel } from './model';
import { decodeShared } from '../editor/files';

const model = loadModel(example);
const stages = stagesOf(model.tutorial);
const finalStep = stages.findIndex((s) => s.kind === 'ink') - 1;
const settings = () => fireEvent.click(screen.getByLabelText('View settings'));
const presentation: SharedPresentation = {
  index: finalStep,
  speed: 2,
  inkMode: 'guide',
  showNames: true,
  showHelpers: true,
  showOriginal: false,
  reduced: false,
  colourFirst: false,
  copies: 'wall',
  camera: { minX: -1, minY: -1, maxX: 1, maxY: 1 },
};
afterEach(() => {
  window.location.hash = '';
});

describe('guide-first lesson mode and settings', () => {
  it('previews only the final construction and still leaves the full ink reveal to the ink stage', () => {
    const { container } = render(
      <Play json={example} reviewIndex={finalStep} />,
    );
    expect(container.querySelector('.destination-guide')).toBeTruthy();
    expect(container.querySelector('.so-far')).toBeNull();
    expect(container.querySelector('.ink')).toBeNull();
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(container.querySelector('.destination-guide')).toBeNull();
    expect(
      container.querySelectorAll('.ink [data-ink]').length,
    ).toBeGreaterThan(0);
  });
  it('keeps the early construction uninked and offers three visible mode choices', () => {
    const { container } = render(<Play json={example} reviewIndex={0} />);
    expect(container.querySelector('.destination-guide')).toBeNull();
    settings();
    expect(screen.getByRole('radio', { name: 'Guide first' })).toHaveProperty(
      'checked',
      true,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'At the end' }));
    expect(
      JSON.parse(localStorage.getItem('tastir.inkMode.v2') ?? 'null'),
    ).toBe('end');
    expect(container.querySelector('.view-menu select')).toBeNull();
    expect(screen.getAllByRole('switch')).toHaveLength(3);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container.querySelector('details')?.open).toBe(false);
    expect(document.activeElement).toBe(screen.getByLabelText('View settings'));
  });
  it('preserves a previously selected progressive ink mode', () => {
    localStorage.setItem('tastir.inkMode', JSON.stringify('asYouGo'));
    render(<Play json={example} reviewIndex={finalStep} />);
    settings();
    expect(screen.getByRole('radio', { name: 'As you go' })).toHaveProperty(
      'checked',
      true,
    );
    expect(document.querySelector('.so-far')).toBeTruthy();
  });
  it('restores a shared step and framing without overwriting receiver preferences', () => {
    localStorage.setItem('tastir.showNames', 'false');
    localStorage.setItem('tastir.showHelpers', 'false');
    localStorage.setItem('tastir.inkMode.v2', '"end"');
    render(
      <Play json={example} address="shared" presentation={presentation} />,
    );
    expect(document.querySelector('.destination-guide')).toBeTruthy();
    expect(document.querySelector('svg.drawing')?.getAttribute('viewBox')).toBe(
      '-1 -1 2 2',
    );
    settings();
    expect(screen.getByLabelText('Show names')).toHaveProperty('checked', true);
    expect(screen.getByLabelText('Show helper lines')).toHaveProperty(
      'checked',
      true,
    );
    expect(screen.getByRole('radio', { name: '2×' })).toHaveProperty(
      'checked',
      true,
    );
    fireEvent.click(screen.getByLabelText('Show names'));
    expect(localStorage.getItem('tastir.showNames')).toBe('false');
    expect(localStorage.getItem('tastir.showHelpers')).toBe('false');
    expect(localStorage.getItem('tastir.inkMode.v2')).toBe('"end"');
  });
  it('restores a shared wall camera and keeps system reduced motion enabled', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
      })),
    );
    try {
      render(
        <Play
          json={example}
          address="shared"
          presentation={{ ...presentation, index: stages.length - 1 }}
        />,
      );
      expect(document.querySelector('svg.wall')?.getAttribute('viewBox')).toBe(
        '-1 -1 2 2',
      );
      settings();
      expect(screen.getByLabelText('Reduce motion')).toHaveProperty(
        'checked',
        true,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('keeps a restored camera when StrictMode replays mount effects', () => {
    render(
      <StrictMode>
        <Play
          json={example}
          address="shared"
          presentation={{ ...presentation, index: stages.length - 1 }}
        />
      </StrictMode>,
    );
    expect(document.querySelector('svg.wall')?.getAttribute('viewBox')).toBe(
      '-1 -1 2 2',
    );
  });
  it('copies the active step and all settings, then opens the same guide in another browser', async () => {
    act(() => {
      window.location.hash = '#/eight-fold-star-and-cross/watch';
    });
    render(<App />);
    const pause = await screen.findByRole('button', {
      name: 'Pause',
    });
    fireEvent.click(pause);
    settings();
    fireEvent.click(screen.getByRole('radio', { name: '2×' }));
    fireEvent.click(screen.getByLabelText('Show names'));
    fireEvent.click(screen.getByLabelText('Show helper lines'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Close view settings' }),
    );
    for (let i = 0; i < finalStep; i++)
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy a share link' }));
    const link = await screen.findByLabelText('Share link');
    const hash =
      (link as HTMLInputElement).value.split('#')[1]?.replace(/^\//, '') ?? '';
    const decoded = await decodeShared(hash.slice('shared/'.length));
    expect(decoded?.presentation).toMatchObject({
      index: finalStep,
      inkMode: 'guide',
      speed: 2,
      showNames: true,
      showHelpers: true,
    });
    cleanup();
    localStorage.clear();
    act(() => {
      window.location.hash = '#/' + hash;
    });
    render(<App />);
    await waitFor(() =>
      expect(document.querySelector('.destination-guide')).toBeTruthy(),
    );
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
  });
});

describe('shared presentation validation', () => {
  it('accepts complete snapshots and rejects impossible cameras, invalid modes and oversized tile arrangements', () => {
    expect(SharedPresentationShape.safeParse(presentation).success).toBe(true);
    for (const patch of [
      { speed: 9 },
      { inkMode: 'future' },
      { index: -1 },
      { copies: [100000, 1] },
      { camera: { minX: 1, maxX: 0, minY: 0, maxY: 1 } },
      { camera: { minX: 0, maxX: Infinity, minY: 0, maxY: 1 } },
    ])
      expect(
        SharedPresentationShape.safeParse({ ...presentation, ...patch })
          .success,
      ).toBe(false);
  });
});
