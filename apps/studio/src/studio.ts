import { readFile, readdir, realpath, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
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
import { constructionSvg, png, wallSvg, type Area } from './picture.js';
import { imageSize, overlaySvg, type Reference } from './reference.js';
import { writeAtomic } from './store.js';
import { check, copyUpTo, emptyDraft, type Draft } from './player.js';

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
  answers: z.number().int().min(1).optional(),
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

/** What people and agents are told about the reference photo. */
const referenceLine = (ref?: Reference) =>
  ref
    ? {
        width: ref.width,
        height: ref.height,
        ...(ref.source ? { source: ref.source } : {}),
        aligned: !!ref.align,
        ...(ref.align ? { align: ref.align } : {}),
      }
    : null;

const slug = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'project';

export interface StudioEvent {
  readonly project: string;
  readonly revision: number;
  /** What changed: the drawing, the notes, or the marks on it. */
  readonly kind: 'drawing' | 'notes' | 'marks' | 'reference';
}
export type Listener = (event: StudioEvent) => void;

/** A mark an agent puts on a named element, shown in Tastir until cleared. */
export interface Mark {
  readonly id: number;
  readonly author: string;
  readonly target: string;
  readonly label: string;
  readonly at: string;
}

export const MarkRequest = z.strictObject({
  author: Author,
  target: z.string().min(1).max(180),
  label: z.string().trim().min(1).max(200),
});
const Pixel = z.strictObject({
  x: z.number().finite(),
  y: z.number().finite(),
});
export const ReferenceRequest = z.strictObject({
  author: Author,
  /** A photo sent from the page, base64. */
  data: z.string().max(22_000_000).optional(),
  /** Or a photo already in docs/research or the player's photos folder. */
  path: z.string().max(400).optional(),
  source: z.string().max(400).optional(),
});
export const AlignRequest = z.strictObject({
  author: Author,
  o: Pixel,
  a: Pixel,
});

export const QuestionRequest = z.strictObject({
  author: Author,
  text: z.string().max(4000),
  about: z.string().min(1).max(180).optional(),
});

export class Studio {
  private cache = new Map<string, Project>();
  private locks = new Map<string, Promise<unknown>>();
  private listeners = new Set<Listener>();
  private marked = new Map<string, readonly Mark[]>();
  private nextMark = 1;
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
  private announce(event: StudioEvent) {
    for (const listener of this.listeners) listener(event);
  }

  private update(
    id: string,
    step: (p: Project) => Project,
    kind: StudioEvent['kind'] = 'drawing',
  ): Promise<Project> {
    const run = (this.locks.get(id) ?? Promise.resolve()).then(async () => {
      const next = step(await this.load(id));
      await this.store.write(next);
      this.cache.set(id, next);
      this.announce({ project: id, revision: next.revision, kind });
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
      reference: referenceLine(p.reference),
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
      reference: referenceLine(p.reference),
    };
  }

  /**
   * Gives the project a reference photo: one sent from the page, or one
   * already in docs/research or the player's photos. A new photo needs
   * lining up again.
   */
  async setReference(id: string, request: z.infer<typeof ReferenceRequest>) {
    let bytes: Buffer;
    if (request.data) bytes = Buffer.from(request.data, 'base64');
    else if (request.path) {
      const repo = resolve(this.tutorials, '..');
      const allowed = [
        join(repo, 'docs', 'research'),
        join(repo, 'apps', 'player', 'public', 'photos'),
      ];
      const file = await realpath(resolve(repo, request.path)).catch(() => '');
      if (!file || !allowed.some((dir) => file.startsWith(dir + sep)))
        throw new StudioError(
          'Use a photo in docs/research or apps/player/public/photos.',
        );
      bytes = await readFile(file);
    } else throw new StudioError('Send a photo, or name one in docs/research.');
    if (bytes.length > 15_000_000)
      throw new StudioError('Use a photo under 15 MB.');
    const size = imageSize(bytes);
    const file = `reference${size.type === 'image/png' ? '.png' : '.jpg'}`;
    const folder = this.store.folder(id);
    const before = (await this.load(id)).reference;
    await writeAtomic(join(folder, file), bytes);
    if (before && before.file !== file)
      await rm(join(folder, before.file), { force: true });
    const source = request.source ?? (request.path ? request.path : undefined);
    const p = await this.update(
      id,
      (p) => ({
        ...p,
        reference: { file, ...size, ...(source ? { source } : {}) },
      }),
      'reference',
    );
    return { project: p.id, reference: referenceLine(p.reference) };
  }

  /** Lines the photo up: where O and A sit on it, in its pixels. */
  async align(id: string, request: z.infer<typeof AlignRequest>) {
    const p = await this.update(
      id,
      (p) => {
        if (!p.reference) throw new StudioError('Add a reference photo first.');
        return {
          ...p,
          reference: { ...p.reference, align: { o: request.o, a: request.a } },
        };
      },
      'reference',
    );
    return { project: p.id, reference: referenceLine(p.reference) };
  }

  async check(id: string) {
    const p = await this.load(id);
    return {
      project: p.id,
      revision: p.revision,
      problems: problems(p.current.draft, p.goals),
    };
  }

  /** A PNG of the construction or the wall, and the revision it shows. */
  async picture(
    id: string,
    what: 'construction' | 'wall' | 'reference' | 'overlay',
    size: number,
    area?: Area,
  ) {
    const p = await this.load(id);
    const draft = p.current.draft;
    let text: string;
    if (what === 'reference' || what === 'overlay') {
      const ref = p.reference;
      if (!ref)
        throw new StudioError('This project has no reference photo yet.');
      const photo = await readFile(join(this.store.folder(id), ref.file));
      text = overlaySvg(
        ref,
        photo,
        what === 'overlay' ? draft : undefined,
        area,
      );
    } else
      text =
        what === 'wall'
          ? wallSvg(draft, 2, area)
          : constructionSvg(draft, area);
    return {
      revision: p.revision,
      png: png(text, Math.max(200, Math.min(1600, size))),
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
    const p = await this.update(
      id,
      (p) =>
        addNote(p, request.author, request.text, undefined, {
          ...(request.answers !== undefined
            ? { answers: request.answers }
            : {}),
        }),
      'notes',
    );
    return { project: p.id, note: p.notes.at(-1) };
  }

  /** Asks the owner something, marking the element it is about. */
  async ask(id: string, request: z.infer<typeof QuestionRequest>) {
    if (request.about)
      await this.point(id, {
        author: request.author,
        target: request.about,
        label: 'Question',
      });
    const p = await this.update(
      id,
      (p) =>
        addNote(p, request.author, request.text, undefined, {
          question: true,
          ...(request.about ? { about: request.about } : {}),
        }),
      'notes',
    );
    return { project: p.id, question: p.notes.at(-1)! };
  }

  /** The answer to a question, waiting up to `seconds` for it. */
  async answer(id: string, question: number, seconds: number) {
    const find = async () =>
      (await this.load(id)).notes.find((n) => n.answers === question);
    const asked = (await this.load(id)).notes.find(
      (n) => n.id === question && n.question,
    );
    if (!asked) throw new StudioError(`There is no question ${question}.`);
    const now = await find();
    if (now || seconds <= 0) return { question, answer: now ?? null };
    return new Promise<{
      question: number;
      answer: Awaited<ReturnType<typeof find>> | null;
    }>((resolve) => {
      const done = (answer: Awaited<ReturnType<typeof find>> | null) => {
        clearTimeout(timer);
        stop();
        resolve({ question, answer });
      };
      const stop = this.subscribe((event) => {
        if (event.project === id && event.kind === 'notes')
          void find().then((a) => a && done(a));
      });
      const timer = setTimeout(() => done(null), Math.min(seconds, 600) * 1000);
    });
  }

  marks(id: string) {
    return { project: id, marks: this.marked.get(id) ?? [] };
  }

  /** Marks a named element; a newer mark on the same element replaces it. */
  async point(id: string, request: z.infer<typeof MarkRequest>) {
    const p = await this.load(id);
    const { scene } = check(p.current.draft);
    if (!scene.elements.has(request.target))
      throw new StudioError(
        `There is no element “${request.target}” to point at. Use a name from inspect.`,
      );
    const mark: Mark = {
      id: this.nextMark++,
      ...request,
      at: new Date().toISOString(),
    };
    const kept = (this.marked.get(id) ?? []).filter(
      (m) => m.target !== request.target,
    );
    this.marked.set(id, [...kept, mark].slice(-12));
    this.announce({ project: id, revision: p.revision, kind: 'marks' });
    return { project: id, mark };
  }

  /** Clears marks: one author's, or everyone's. */
  async clearMarks(id: string, author?: string) {
    const p = await this.load(id);
    this.marked.set(
      id,
      author
        ? (this.marked.get(id) ?? []).filter((m) => m.author !== author)
        : [],
    );
    this.announce({ project: id, revision: p.revision, kind: 'marks' });
    return this.marks(id);
  }
}
