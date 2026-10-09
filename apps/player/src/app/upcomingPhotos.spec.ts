import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  UPCOMING_PATTERNS,
  upcomingPhotoSrc,
  upcomingDrawnSrc,
} from './upcoming-patterns';

// Tests run from apps/player or from the repo root.
const ROOT = process.cwd().replace(/\/apps\/player$/, '');
const UPCOMING_PUBLIC = join(ROOT, 'apps', 'player', 'public', 'upcoming');
const RESEARCH = join(ROOT, 'docs', 'research');

function sha256Of(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function allFilesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...allFilesUnder(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('photos of upcoming patterns', () => {
  it('ships only photos with free licence entries in public/upcoming, and no other files', () => {
    if (!existsSync(UPCOMING_PUBLIC)) return;
    const publicFiles = readdirSync(UPCOMING_PUBLIC).filter((f) =>
      statSync(join(UPCOMING_PUBLIC, f)).isFile(),
    );

    const freePatterns = UPCOMING_PATTERNS.filter(
      (p) => p.photo && !p.photo.private,
    );

    for (const file of publicFiles) {
      const match = freePatterns.find((p) => {
        const pFile = p.photo?.file.replace(/^upcoming\//, '');
        return pFile === file;
      });
      expect(
        match,
        `File ${file} in public/upcoming/ has no free licence entry in UPCOMING_PATTERNS`,
      ).toBeDefined();

      const photo = match!.photo!;
      expect(photo.creator.trim().length).toBeGreaterThan(0);
      expect(photo.url.trim().length).toBeGreaterThan(0);
      expect(photo.license.toLowerCase()).not.toContain('all rights reserved');
    }
  });

  it('ensures no file in public/upcoming/ is identical to any file under docs/research/', () => {
    if (!existsSync(UPCOMING_PUBLIC) || !existsSync(RESEARCH)) return;

    const publicFiles = readdirSync(UPCOMING_PUBLIC).filter((f) =>
      statSync(join(UPCOMING_PUBLIC, f)).isFile(),
    );
    const researchFiles = allFilesUnder(RESEARCH);
    const researchHashes = new Map<string, string>();
    for (const rf of researchFiles) {
      researchHashes.set(sha256Of(rf), rf);
    }

    for (const pf of publicFiles) {
      const fullPath = join(UPCOMING_PUBLIC, pf);
      const hash = sha256Of(fullPath);
      const collision = researchHashes.get(hash);
      expect(
        collision,
        `File ${pf} in public/upcoming/ is identical to private file under docs/research: ${collision}`,
      ).toBeUndefined();
    }
  });

  it('finds every private upcoming photo in docs/research/upcoming, where docs/research exists', () => {
    if (!existsSync(RESEARCH)) return;
    const missing = UPCOMING_PATTERNS.filter((p) => p.photo?.private)
      .filter((p) => {
        const file = p.photo!.file.replace(/^upcoming\//, '');
        return (
          !existsSync(join(RESEARCH, 'upcoming', file)) &&
          !existsSync(join(RESEARCH, file))
        );
      })
      .map((p) => `${p.id}: ${p.photo!.file}`);
    expect(missing).toEqual([]);
  });

  it('serves a free photo from upcoming/, and a private one only in dev', () => {
    const free = UPCOMING_PATTERNS.find(
      (p) => p.photo && !p.photo.private,
    )?.photo;
    const priv = UPCOMING_PATTERNS.find(
      (p) => p.photo && p.photo.private,
    )?.photo;

    expect(free).toBeDefined();
    expect(priv).toBeDefined();

    expect(upcomingPhotoSrc(free!, false)).toMatch(/\/upcoming\/[^/]+$/);
    expect(upcomingPhotoSrc(priv!, true)).toMatch(
      /^\/__review\/research\/upcoming\/[^/]+$/,
    );
    expect(upcomingPhotoSrc(priv!, false)).toBeUndefined();
  });

  it('serves a drawn pattern image only in dev from /__review/research/upcoming/', () => {
    const withDrawn = UPCOMING_PATTERNS.find((p) => p.drawnUrl);
    expect(withDrawn).toBeDefined();
    expect(upcomingDrawnSrc(withDrawn!.drawnUrl, true)).toMatch(
      /^\/__review\/research\/upcoming\/[^/]+$/,
    );
    expect(upcomingDrawnSrc(withDrawn!.drawnUrl, false)).toBeUndefined();
  });

  it('finds every upcoming drawn image in docs/research/upcoming, where docs/research exists', () => {
    if (!existsSync(RESEARCH)) return;
    const missing = UPCOMING_PATTERNS.filter((p) => p.drawnUrl)
      .filter((p) => {
        const file = p.drawnUrl!.replace(/^upcoming\//, '');
        return (
          !existsSync(join(RESEARCH, 'upcoming', file)) &&
          !existsSync(join(RESEARCH, file))
        );
      })
      .map((p) => `${p.id}: ${p.drawnUrl!}`);
    expect(missing).toEqual([]);
  });
});
