import { mkdir, open, readFile, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DraftShape } from '@tastir/schema';
import { StudioError } from './ops.js';
import type { Project } from './project.js';

/**
 * Projects on disk: studio/<id>/project.json, written whole and atomically
 * after every change, plus studio/<id>/pattern.json, the drawing as a
 * pattern file that Tastir's normal file import opens.
 */
export const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export async function writeAtomic(
  path: string,
  text: string | Buffer,
  mode = 0o600,
) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, 'wx', mode);
    try {
      await file.writeFile(text);
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

function isProject(x: unknown): x is Project {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as Record<string, unknown>;
  const current = p['current'] as Record<string, unknown> | undefined;
  return (
    p['format'] === 1 &&
    typeof p['id'] === 'string' &&
    typeof p['revision'] === 'number' &&
    Array.isArray(p['past']) &&
    Array.isArray(p['future']) &&
    Array.isArray(p['notes']) &&
    DraftShape.safeParse(current?.['draft']).success
  );
}

export class ProjectStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(readonly root: string) {}

  folder(id: string) {
    if (!ID.test(id)) throw new StudioError(`“${id}” is not a project id.`);
    return join(this.root, id);
  }

  async list(): Promise<Project[]> {
    await mkdir(this.root, { recursive: true });
    const out: Project[] = [];
    for (const entry of await readdir(this.root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !ID.test(entry.name)) continue;
      const project = await this.read(entry.name).catch(() => undefined);
      if (project) out.push(project);
    }
    return out.sort((a, b) => b.updated.localeCompare(a.updated));
  }

  async read(id: string): Promise<Project> {
    let raw: string;
    try {
      raw = await readFile(join(this.folder(id), 'project.json'), 'utf8');
    } catch {
      throw new StudioError(`There is no project “${id}”.`);
    }
    const project: unknown = JSON.parse(raw);
    if (!isProject(project) || project.id !== id)
      throw new StudioError(
        `The project file for “${id}” cannot be read. It has been left unchanged.`,
      );
    return project;
  }

  /** Writes one project at a time, in the order the changes were made. */
  write(project: Project): Promise<void> {
    const task = this.queue.then(async () => {
      const folder = this.folder(project.id);
      await mkdir(folder, { recursive: true, mode: 0o700 });
      await writeAtomic(join(folder, 'project.json'), JSON.stringify(project));
      await writeAtomic(
        join(folder, 'pattern.json'),
        `${JSON.stringify({ tastir: 'pattern', version: 1, tutorial: project.current.draft }, null, 2)}\n`,
      );
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
}
