import { fireEvent, render, screen, within } from '@testing-library/react';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTutorial, type Photo } from '@tastir/schema';
import { Original, photoSrc } from './Original';

// Tests run from apps/player or from the repo root.
const ROOT = process.cwd().replace(/\/apps\/player$/, '');
const PHOTOS = join(ROOT, 'apps', 'player', 'public', 'photos');
const RESEARCH = join(ROOT, 'docs', 'research');

const photosOf = (): { id: string; photo: Photo }[] =>
  readdirSync(join(ROOT, 'tutorials'))
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const t = parseTutorial(
        JSON.parse(readFileSync(join(ROOT, 'tutorials', f), 'utf8')),
      );
      return (t.photos ?? []).map((photo) => ({ id: t.id, photo }));
    });

const free: Photo = {
  file: 'cairo-minbar-doors-met.jpg',
  caption: 'Pair of minbar doors.',
  creator: 'The Metropolitan Museum of Art',
  license: 'Public domain (CC0)',
  url: 'https://www.metmuseum.org/art/collection/search/444812',
};
const kept: Photo = {
  file: 'alhambra-wichmann/wade-spa_0218.jpg',
  caption: 'The carved panel.',
  creator: 'David Wade',
  license: 'All rights reserved',
  url: 'https://patterninislamicart.com/',
  private: true,
};

describe('photos of the originals', () => {
  it('ships every free photo a tutorial names, and no other', () => {
    const named = photosOf()
      .filter(({ photo }) => !photo.private)
      .map(({ photo }) => photo.file);
    for (const file of named) expect(existsSync(join(PHOTOS, file))).toBe(true);
    expect(readdirSync(PHOTOS).sort()).toEqual([...new Set(named)].sort());
  });

  it('finds every private photo in docs/research, where that folder exists', () => {
    if (!existsSync(RESEARCH)) return;
    const missing = photosOf()
      .filter(({ photo }) => photo.private)
      .filter(({ photo }) => !existsSync(join(RESEARCH, photo.file)))
      .map(({ id, photo }) => `${id}: ${photo.file}`);
    expect(missing).toEqual([]);
  });

  it('serves a free photo from photos/, and a private one only in dev', () => {
    expect(photoSrc(free, false)).toMatch(
      /photos\/cairo-minbar-doors-met\.jpg$/,
    );
    expect(photoSrc(kept, true)).toBe(
      '/__review/research/alhambra-wichmann/wade-spa_0218.jpg',
    );
    expect(photoSrc(kept, false)).toBeUndefined();
  });

  it('shows the photo with its credit', () => {
    render(<Original photos={[free]} dev={false} />);
    expect(
      screen.getByRole('button', { name: /full size: Pair of minbar doors/ }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Photo: The Metropolitan Museum of Art/),
    ).toBeTruthy();
  });

  it('shows a placeholder with a link for a private photo outside dev', () => {
    render(<Original photos={[kept]} dev={false} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(
      screen.getByText(/A photo of the real pattern is to come/),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'its source' }).getAttribute('href'),
    ).toBe('https://patterninislamicart.com/');
  });

  it('opens a free photo at full size, at actual size, and closes on Esc', () => {
    render(<Original photos={[free]} dev={false} />);
    fireEvent.click(screen.getByRole('button', { name: /full size/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('img')?.getAttribute('src')).toMatch(
      /cairo-minbar-doors-met\.jpg$/,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actual size' }));
    expect(dialog.querySelector('.full-size-view.actual')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each([free, kept])(
    'replaces a missing $file with its source link',
    (photo) => {
      render(<Original photos={[photo]} dev />);
      fireEvent.error(screen.getByRole('img'));
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByRole('button', { name: /full size/ })).toBeNull();
      expect(screen.getByText('This photo could not be loaded.')).toBeTruthy();
      expect(
        screen.getByRole('link', { name: 'its source' }).getAttribute('href'),
      ).toBe(photo.url);
    },
  );

  it('keeps a failed full-size photo viewer open with a source link and Close', () => {
    render(<Original photos={[free]} dev={false} />);
    fireEvent.click(screen.getByRole('button', { name: /full size/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Actual size' }),
    );
    fireEvent.error(within(dialog).getByRole('img'));
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(
      within(dialog).getByText('This photo could not be loaded.'),
    ).toBeTruthy();
    expect(
      within(dialog)
        .getByRole('link', { name: 'its source' })
        .getAttribute('href'),
    ).toBe(free.url);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('still shows other gallery photos after one fails', () => {
    render(<Original photos={[kept, free]} dev />);
    fireEvent.error(screen.getByRole('img'));
    fireEvent.click(screen.getByRole('button', { name: 'Photo 2' }));
    expect(screen.getByRole('img').getAttribute('alt')).toBe(free.caption);
    fireEvent.click(screen.getByRole('button', { name: 'Photo 1' }));
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('focuses the viewer, keeps Tab inside it, and restores focus and page scrolling', () => {
    render(<Original photos={[free]} dev={false} />);
    const opener = screen.getByRole('button', { name: /full size/ });
    const previousOverflow = document.body.style.overflow;
    opener.focus();
    fireEvent.click(opener);
    const close = screen.getByRole('button', { name: 'Close' });
    const zoom = screen.getByRole('button', { name: 'Actual size' });
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(zoom);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe(previousOverflow);
  });

  it('returns focus to the source if the launch photo disappeared while viewing', () => {
    render(<Original photos={[free]} dev={false} />);
    const opener = screen.getByRole('button', { name: /full size/ });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    within(dialog).getByRole('button', { name: 'Actual size' }).focus();
    fireEvent.error(within(dialog).getByRole('img'));
    const close = within(dialog).getByRole('button', { name: 'Close' });
    expect(document.activeElement).toBe(close);
    fireEvent.click(close);
    expect(document.activeElement).toBe(
      screen.getByRole('link', { name: 'its source' }),
    );
  });

  it('selects the first photo when a replacement gallery is shorter', () => {
    const view = render(<Original photos={[kept, free]} dev />);
    fireEvent.click(screen.getByRole('button', { name: 'Photo 2' }));
    view.rerender(
      <Original photos={[free, kept, { ...free, file: 'another.jpg' }]} dev />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Photo 3' }));
    view.rerender(<Original photos={[free, kept]} dev />);
    expect(screen.getByRole('img').getAttribute('alt')).toBe(free.caption);
    expect(
      screen
        .getByRole('button', { name: 'Photo 1' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
