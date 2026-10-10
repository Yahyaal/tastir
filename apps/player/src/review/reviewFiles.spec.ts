import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { reviewFile, reviewFolders } from '../../reviewFiles';

describe('review pictures in linked worktrees', () => {
  let root: string;
  let main: string;
  let linked: string;
  beforeAll(() => {
    root = mkdtempSync(resolve(tmpdir(), 'tastir-review-'));
    writeFileSync(resolve(root, 'outside.png'), 'must stay private');
    main = resolve(root, 'main');
    linked = resolve(root, 'linked');
    mkdirSync(main);
    execFileSync('git', ['init', '-q', main]);
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.com',
        'commit',
        '-q',
        '--allow-empty',
        '-m',
        'test',
      ],
      { cwd: main },
    );
    execFileSync('git', ['worktree', 'add', '-q', '-b', 'pictures', linked], {
      cwd: main,
    });
    for (const tree of [main, linked])
      for (const folder of ['review', 'research'])
        mkdirSync(resolve(tree, 'docs', folder), { recursive: true });
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it.each(['renders', 'research'])(
    'prefers local %s but falls back for each missing file',
    (folder) => {
      const roots = reviewFolders(resolve(linked, 'docs'))[folder]!;
      expect(roots).toEqual([
        resolve(linked, 'docs', folder === 'renders' ? 'review' : 'research'),
        resolve(main, 'docs', folder === 'renders' ? 'review' : 'research'),
      ]);
      writeFileSync(resolve(roots[1]!, 'main-only.png'), 'main');
      writeFileSync(resolve(roots[1]!, 'override.png'), 'main');
      writeFileSync(resolve(roots[0]!, 'override.png'), 'local');
      expect(readFileSync(reviewFile(roots, ['main-only.png'])!, 'utf8')).toBe(
        'main',
      );
      expect(readFileSync(reviewFile(roots, ['override.png'])!, 'utf8')).toBe(
        'local',
      );
      expect(reviewFile(roots, ['missing.png'])).toBeUndefined();
      expect(
        reviewFile(roots, ['..', '..', '..', 'outside.png']),
      ).toBeUndefined();
      expect(reviewFile(roots, [])).toBeUndefined();
    },
  );
});
