import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { Project } from './project.js';
import { ProjectStore, writeAtomic } from './store.js';

/**
 * Where the studio keeps its projects: folders on this computer (the
 * default), or a Postgres database for the hosted studio. The studio's
 * edit logic works on whole projects either way; a backend only loads
 * them and saves what changed.
 */
export interface Mark {
  readonly id: number;
  readonly author: string;
  readonly target: string;
  readonly label: string;
  readonly at: string;
}

export interface ProjectLine {
  readonly id: string;
  readonly title: string;
  readonly updated: string;
  readonly revision: number;
}

/** Thrown by commit when someone else saved the project first. */
export class Conflict extends Error {
  constructor() {
    super('Someone else saved this project at the same moment.');
  }
}

export interface Backend {
  /** The folder for local files such as contests. */
  readonly root: string;
  list(): Promise<ProjectLine[]>;
  exists(id: string): Promise<boolean>;
  /**
   * The project. A database backend leaves the drawings of old history
   * steps unread unless `drafts` asks for that many of the latest undo
   * and redo steps, which only Undo and Redo need.
   */
  load(id: string, drafts?: number): Promise<Project>;
  create(project: Project): Promise<void>;
  /** Saves `next` in place of `before`, or throws Conflict. */
  commit(before: Project, next: Project): Promise<void>;
  putPhoto(id: string, file: string, bytes: Buffer): Promise<void>;
  getPhoto(id: string, file: string): Promise<Buffer>;
  removePhoto(id: string, file: string): Promise<void>;
  /** Marks newer than an hour, oldest first. */
  marks(id: string): Promise<Mark[]>;
  /** Adds a mark, replacing one on the same element, keeping the last 12. */
  putMark(id: string, mark: Omit<Mark, 'id'>): Promise<Mark>;
  clearMarks(id: string, author?: string): Promise<void>;
  close(): Promise<void>;
}

const HOUR = 60 * 60 * 1000;

/** Projects as folders, as the local studio has always kept them. */
export class FileBackend implements Backend {
  private store: ProjectStore;
  private cache = new Map<string, Project>();
  private marked = new Map<string, readonly Mark[]>();
  private nextMark = 1;

  constructor(readonly root: string) {
    this.store = new ProjectStore(root);
  }

  async list() {
    return (await this.store.list()).map((p) => ({
      id: p.id,
      title: p.title,
      updated: p.updated,
      revision: p.revision,
    }));
  }

  async exists(id: string) {
    return !!(await this.store.read(id).catch(() => undefined));
  }

  async load(id: string) {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const project = await this.store.read(id);
    this.cache.set(id, project);
    return project;
  }

  async create(project: Project) {
    await this.store.write(project);
    this.cache.set(project.id, project);
  }

  // One process owns the folder (the launcher refuses a second studio) and
  // the studio changes one project at a time, so nothing can come between.
  async commit(_before: Project, next: Project) {
    await this.store.write(next);
    this.cache.set(next.id, next);
  }

  async putPhoto(id: string, file: string, bytes: Buffer) {
    await writeAtomic(join(this.store.folder(id), file), bytes);
  }

  getPhoto(id: string, file: string) {
    return readFile(join(this.store.folder(id), file));
  }

  async removePhoto(id: string, file: string) {
    await rm(join(this.store.folder(id), file), { force: true });
  }

  async marks(id: string) {
    const fresh = (this.marked.get(id) ?? []).filter(
      (m) => Date.now() - Date.parse(m.at) < HOUR,
    );
    this.marked.set(id, fresh);
    return [...fresh];
  }

  async putMark(id: string, mark: Omit<Mark, 'id'>) {
    const made = { id: this.nextMark++, ...mark };
    const kept = (await this.marks(id)).filter((m) => m.target !== mark.target);
    this.marked.set(id, [...kept, made].slice(-12));
    return made;
  }

  async clearMarks(id: string, author?: string) {
    this.marked.set(
      id,
      author ? (await this.marks(id)).filter((m) => m.author !== author) : [],
    );
  }

  async close() {
    // Nothing to close: every change is already on disk.
  }
}
