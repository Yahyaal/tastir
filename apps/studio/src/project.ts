import { StudioError, type Goals } from './ops.js';
import type { Draft } from './player.js';
import type { Reference } from './reference.js';

/**
 * A studio project: one shared drawing, the history of who changed it, and
 * the notes people and agents leave each other. Pure data and pure
 * functions; the store writes it to disk and the service shares it.
 */
export interface Action {
  /** Who made the change: "owner", or an agent such as "claude-code". */
  readonly author: string;
  readonly label: string;
  readonly at: string;
}

/** A drawing and the change that made it. */
export interface Entry {
  readonly draft: Draft;
  readonly action: Action;
}

export interface Note {
  readonly id: number;
  readonly author: string;
  readonly text: string;
  readonly at: string;
  /** A question waiting for the owner's answer. */
  readonly question?: true;
  /** The element of the drawing it is about. */
  readonly about?: string;
  /** The question this note answers. */
  readonly answers?: number;
}

export interface Project {
  readonly format: 1;
  readonly id: string;
  readonly title: string;
  readonly created: string;
  readonly updated: string;
  readonly goals: Goals;
  /** Goes up by one on every change, Undo and Redo included, so an edit
   * based on an older view can always be told apart and refused. */
  readonly revision: number;
  readonly current: Entry;
  readonly past: readonly Entry[];
  readonly future: readonly Entry[];
  readonly notes: readonly Note[];
  /** A photo to recreate the pattern from, when there is one. */
  readonly reference?: Reference;
  /** The latest changes sent with a command id, so a retry is not done
   * twice. Saved with the change itself. */
  readonly receipts?: readonly Receipt[];
}

/**
 * A change sent with a command id: who sent it, a fingerprint of what it
 * asked for, and what it made (the revision, or the note it posted).
 */
export interface Receipt {
  /** The author and the command id. */
  readonly key: string;
  readonly hash: string;
  readonly revision: number;
  readonly note?: number;
  readonly at: string;
}

const RECEIPTS = 200;

/** The project with one more receipt, keeping the latest few hundred. */
export function withReceipt(project: Project, receipt: Receipt): Project {
  return {
    ...project,
    receipts: [...(project.receipts ?? []).slice(-(RECEIPTS - 1)), receipt],
  };
}

const HISTORY = 100;
export const OWNER = 'owner';

export function newProject(
  id: string,
  draft: Draft,
  author: string,
  goals: Goals = {},
  at = new Date().toISOString(),
): Project {
  return {
    format: 1,
    id,
    title: draft.title,
    created: at,
    updated: at,
    goals,
    revision: 1,
    current: { draft, action: { author, label: 'Started the project', at } },
    past: [],
    future: [],
    notes: [],
  };
}

function fresh(project: Project, revision: number) {
  if (revision !== project.revision)
    throw new StudioError(
      `The drawing has changed since revision ${revision}; it is now at revision ${project.revision}. Call inspect and try again.`,
    );
}

/** One edit: the change runs on the current drawing, or nothing changes. */
export function applyEdit(
  project: Project,
  revision: number,
  author: string,
  label: string,
  change: (draft: Draft) => Draft,
  at = new Date().toISOString(),
): Project {
  fresh(project, revision);
  const draft = change(project.current.draft);
  return {
    ...project,
    title: draft.title,
    updated: at,
    revision: project.revision + 1,
    current: { draft, action: { author, label, at } },
    past: [...project.past.slice(-(HISTORY - 1)), project.current],
    future: [],
  };
}

/**
 * Undo or Redo several changes at once. With `mine`, only the author's own
 * changes may be undone or redone; meeting anyone else's refuses the whole
 * request, so an agent never reverses the owner's work by accident.
 */
export function travel(
  project: Project,
  revision: number,
  author: string,
  direction: 'undo' | 'redo',
  steps: number,
  mine: boolean,
  at = new Date().toISOString(),
): Project {
  fresh(project, revision);
  if (!Number.isInteger(steps) || steps < 1)
    throw new StudioError('Give a whole number of steps, at least 1.');
  const available =
    direction === 'undo' ? project.past.length : project.future.length;
  if (steps > available)
    throw new StudioError(
      `Only ${available} ${direction} step${available === 1 ? '' : 's'} are available. Nothing changed.`,
    );
  // The changes this would reverse (undo) or replay (redo), in order.
  const changes =
    direction === 'undo'
      ? [project.current, ...project.past.slice(1).reverse()].slice(0, steps)
      : project.future.slice(0, steps);
  const other = changes.find((e) => e.action.author !== author);
  if (mine && other)
    throw new StudioError(
      `“${other.action.label}” was made by ${other.action.author}, so undoing only your own changes stops there. Nothing changed.`,
    );
  let { current, past, future } = project;
  for (let i = 0; i < steps; i++) {
    if (direction === 'undo') {
      future = [current, ...future];
      current = past.at(-1)!;
      past = past.slice(0, -1);
    } else {
      past = [...past, current];
      current = future[0]!;
      future = future.slice(1);
    }
  }
  return {
    ...project,
    title: current.draft.title,
    updated: at,
    revision: project.revision + 1,
    current,
    past,
    future,
  };
}

/** The history, newest first, as people and agents read it. */
export function historyOf(project: Project, limit = 20) {
  const show = (e: Entry) => ({
    author: e.action.author,
    label: e.action.label,
    at: e.action.at,
  });
  return {
    undo: [project.current, ...[...project.past].reverse()]
      .slice(0, project.past.length)
      .slice(0, limit)
      .map(show),
    redo: project.future.slice(0, limit).map(show),
  };
}

export function addNote(
  project: Project,
  author: string,
  text: string,
  at = new Date().toISOString(),
  extra: Pick<Note, 'question' | 'about' | 'answers'> = {},
): Project {
  const clean = text.trim();
  if (!clean) throw new StudioError('A note needs some text.');
  if (clean.length > 4000)
    throw new StudioError('Keep a note under 4,000 characters.');
  if (
    extra.answers !== undefined &&
    !project.notes.some((n) => n.id === extra.answers && n.question)
  )
    throw new StudioError(`There is no question ${extra.answers}.`);
  const id = (project.notes.at(-1)?.id ?? 0) + 1;
  return {
    ...project,
    updated: at,
    notes: [
      ...project.notes.slice(-499),
      { id, author, text: clean, at, ...extra },
    ],
  };
}
