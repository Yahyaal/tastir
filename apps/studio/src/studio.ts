import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { DraftShape, parseTutorial } from '@tastir/schema';
import {
  construct,
  ink,
  inspect,
  paint,
  problems,
  setTile,
  StudioError,
  type Goals,
} from './ops.js';
import {
  addNote,
  applyEdit,
  historyOf,
  newProject,
  travel,
  type Project,
} from './project.js';
import { ProjectStore } from './store.js';
import { copyUpTo, emptyDraft, type Draft } from './player.js';

/**
 * The one owner of every open project. People and agents all edit through
 * it, one change at a time per project, and everyone watching hears about
 * each change once it is safely on disk.
 */
export const Author = z
  .string()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9 ._()-]{0,59}$/,
    'Name the author in plain letters and digits.',
  );

export const GoalsShape = z.strictObject({
  fold: z.number().int().min(2).max(24).optional(),
  maxSteps: z.number().int().min(1).max(500).optional(),
  tile: z.enum(['parallelogram', 'hexagon']).optional(),
  pieceTypes: z.number().int().min(1).max(64).optional(),
});

export const NewShape = z.strictObject({
  author: Author,
  title: z.string().trim().min(1).max(120),
  fold: z.number().int().min(2).max(24).optional(),
  from: z
    .strictObject({
      tutorial: z.string().regex(/^[a-z0-9-]+$/),
      step: z.number().int().min(0).optional(),
    })
    .optional(),
  goals: GoalsShape.optional(),
});

const Names = z.array(z.string().min(1).max(180)).max(128);
export const EditShape = z.discriminatedUnion('op', [
  z.strictObject({
    op: z.literal('construct'),
    add: z.array(z.unknown()).max(32).default([]),
    remove: Names.default([]),
  }),
  z.strictObject({
    op: z.literal('ink'),
    add: z
      .array(z.strictObject({ from: z.string(), to: z.string() }))
      .max(64)
      .default([]),
    remove: Names.default([]),
  }),
  z.strictObject({ op: z.literal('tile'), vertices: Names }),
  z.strictObject({
    op: z.literal('paint'),
    palette: z.string().nullable().default(null),
    colors: z
      .array(z.strictObject({ piece: z.string(), color: z.string() }))
      .max(128)
      .default([]),
  }),
  z.strictObject({ op: z.literal('replace'), draft: z.unknown() }),
  z.strictObject({ op: z.literal('goals'), goals: GoalsShape }),
]);
export type Edit = z.infer<typeof EditShape>;

export const EditRequest = z.strictObject({
  author: Author,
  revision: z.number().int().min(1),
  label: z.string().trim().min(1).max(160).optional(),
  edit: EditShape,
});

export const TravelRequest = z.strictObject({
  author: Author,
  revision: z.number().int().min(1),
  direction: z.enum(['undo', 'redo']),
  steps: z.number().int().min(1).max(100).default(1),
  mine: z.boolean().default(true),
});

export const NoteRequest = z.strictObject({
  author: Author,
  text: z.string().max(4000),
});

function labelOf(edit: Edit): string {
  switch (edit.op) {
    case 'construct': {
      const names = edit.add.map((a) => (a as { name?: string }).name ?? '?');
      return [
        names.length ? `Added ${names.join(', ')}` : '',
        edit.remove.length ? `Removed ${edit.remove.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; ');
    }
    case 'ink':
      return [
        edit.add.length
          ? `Inked ${edit.add.map((s) => `${s.from}–${s.to}`).join(', ')}`
          : '',
        edit.remove.length ? `Removed ink ${edit.remove.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; ');
    case 'tile':
      return `Tile ${edit.vertices.join(', ')}`;
    case 'paint':
      return edit.palette ? `Palette ${edit.palette}` : 'Colored pieces';
    case 'replace':
      return 'Edited in Tastir';
    case 'goals':
      return 'Changed the goals';
  }
}

function change(edit: Edit): (draft: Draft) => Draft {
  switch (edit.op) {
    case 'construct':
      return (d) => construct(d, edit.add, edit.remove);
    case 'ink':
      return (d) => ink(d, edit.add, edit.remove);
    case 'tile':
      return (d) => setTile(d, edit.vertices);
    case 'paint':
      return (d) => paint(d, edit.palette, edit.colors);
    case 'replace':
      return () => {
        const parsed = DraftShape.safeParse(edit.draft);
        if (!parsed.success)
          throw new StudioError('That is not a Tastir pattern.');
        return parsed.data as Draft;
      };
    case 'goals':
      return (d) => d;
  }
}

const slug = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'project';

export type Listener = (event: { project: string; revision: number }) => void;

export class Studio {
  private cache = new Map<string, Project>();
  private locks = new Map<string, Promise<unknown>>();
  private listeners = new Set<Listener>();
  readonly store: ProjectStore;

  constructor(
    root: string,
    private tutorials: string,
  ) {
    this.store = new ProjectStore(root);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async load(id: string) {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const project = await this.store.read(id);
    this.cache.set(id, project);
    return project;
  }

  /** Runs one change of one project at a time, then saves and announces it. */
  private update(id: string, step: (p: Project) => Project): Promise<Project> {
    const run = (this.locks.get(id) ?? Promise.resolve()).then(async () => {
      const next = step(await this.load(id));
      await this.store.write(next);
      this.cache.set(id, next);
      for (const listener of this.listeners)
        listener({ project: id, revision: next.revision });
      return next;
    });
    this.locks.set(
      id,
      run.catch(() => undefined),
    );
    return run;
  }

  async list() {
    return (await this.store.list()).map((p) => ({
      id: p.id,
      title: p.title,
      updated: p.updated,
      revision: p.revision,
    }));
  }

  async library() {
    const out: { id: string; title: string; steps: number }[] = [];
    for (const file of (await readdir(this.tutorials)).sort()) {
      if (!file.endsWith('.json')) continue;
      try {
        const t = parseTutorial(
          JSON.parse(await readFile(join(this.tutorials, file), 'utf8')),
        );
        out.push({ id: t.id, title: t.title, steps: t.steps.length });
      } catch {
        // A tutorial that does not parse is left out of the list.
      }
    }
    return out;
  }

  async create(request: z.infer<typeof NewShape>) {
    let draft: Draft;
    if (request.from) {
      const file = join(this.tutorials, `${request.from.tutorial}.json`);
      let tutorial;
      try {
        tutorial = parseTutorial(JSON.parse(await readFile(file, 'utf8')));
      } catch {
        throw new StudioError(
          `There is no library tutorial “${request.from.tutorial}”.`,
        );
      }
      const step = Math.min(
        request.from.step ?? tutorial.steps.length,
        tutorial.steps.length,
      );
      draft = { ...copyUpTo(tutorial, step), title: request.title };
    } else {
      draft = {
        ...emptyDraft('studio', request.title),
        fold: request.fold ?? 8,
      };
    }
    let id = '';
    for (;;) {
      id = `${slug(request.title)}-${randomBytes(2).toString('hex')}`;
      if (!(await this.store.read(id).catch(() => undefined))) break;
    }
    draft = { ...draft, id };
    const project = newProject(id, draft, request.author, request.goals ?? {});
    await this.store.write(project);
    this.cache.set(id, project);
    return this.view(id);
  }

  async view(id: string) {
    const p = await this.load(id);
    return {
      project: p.id,
      revision: p.revision,
      goals: p.goals,
      drawing: inspect(p.current.draft),
      history: historyOf(p),
      notes: p.notes.length,
    };
  }

  async draft(id: string) {
    const p = await this.load(id);
    return {
      project: p.id,
      revision: p.revision,
      draft: p.current.draft,
      history: historyOf(p),
    };
  }

  async check(id: string) {
    const p = await this.load(id);
    return {
      project: p.id,
      revision: p.revision,
      problems: problems(p.current.draft, p.goals),
    };
  }

  async edit(id: string, request: z.infer<typeof EditRequest>) {
    const { edit } = request;
    await this.update(id, (p) => {
      const next = applyEdit(
        p,
        request.revision,
        request.author,
        request.label ?? labelOf(edit),
        change(edit),
      );
      return edit.op === 'goals'
        ? { ...next, goals: edit.goals as Goals }
        : next;
    });
    return this.view(id);
  }

  async travel(id: string, request: z.infer<typeof TravelRequest>) {
    await this.update(id, (p) =>
      travel(
        p,
        request.revision,
        request.author,
        request.direction,
        request.steps,
        request.mine,
      ),
    );
    return this.view(id);
  }

  async notes(id: string, after = 0) {
    const p = await this.load(id);
    return {
      project: p.id,
      revision: p.revision,
      notes: p.notes.filter((n) => n.id > after),
    };
  }

  async note(id: string, request: z.infer<typeof NoteRequest>) {
    const p = await this.update(id, (p) =>
      addNote(p, request.author, request.text),
    );
    return { project: p.id, note: p.notes.at(-1) };
  }
}
