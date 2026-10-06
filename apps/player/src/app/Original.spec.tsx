import { render, screen } from '@testing-library/react';
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
      screen.getByRole('img', { name: 'Pair of minbar doors.' }),
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
});
