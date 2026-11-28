import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/** Ignored pictures can be split between a linked worktree and the main tree. */
export function reviewFolders(docs: string): Record<string, string[]> {
  const roots = [docs];
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: docs,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const mainDocs = resolve(docs, common, '..', 'docs');
    if (mainDocs !== docs) roots.push(mainDocs);
  } catch {
    // A source archive can serve its own pictures without Git metadata.
  }
  return {
    renders: roots.map((root) => resolve(root, 'review')),
    research: roots.map((root) => resolve(root, 'research')),
  };
}

/** Prefer a local file, then try the main tree; never serve outside a root. */
export function reviewFile(roots: readonly string[], parts: readonly string[]) {
  for (const root of roots) {
    const file = resolve(root, ...parts);
    if (
      file.startsWith(root + sep) &&
      existsSync(file) &&
      statSync(file).isFile()
    )
      return file;
  }
  return undefined;
}
