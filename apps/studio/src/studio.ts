import { readFile, readdir, realpath } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
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
  withReceipt,
  type Project,
  type Receipt,
} from './project.js';
import { Conflict, FileBackend, type Backend, type Mark } from './backend.js';
import { constructionSvg, png, wallSvg, type Area } from './picture.js';
import { imageSize, overlaySvg, type Reference } from './reference.js';
import { check, copyUpTo, emptyDraft, type Draft } from './player.js';
import { isProject } from './store.js';

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

/**
 * A command id an agent may send with a change. A retry with the same id
 * returns what the first one did instead of doing it again.
 */
export const Command = z
  .string()
  .regex(
    /^[A-Za-z0-9._:-]{1,80}$/,
    'A command id is up to 80 letters, digits and . _ : -',
  )
  .optional();

const Names = z.array(z.string().min(1).max(180)).max(128);
/** A piece's color, for all of its pieces or only some (see paint). */
export const PaintColorShape = z.strictObject({
  piece: z.string(),
  color: z.string(),
  cell: z
    .array(z.number().int())
    .length(2)
    .optional()
    .describe(
      'Only the pieces in this cell of the repeat, from [0, 0] to the repeat minus one.',
    ),
  nth: z
    .number()
    .int()
    .optional()
    .describe(
      "Only this one of the shape's pieces in each tile, from 0 to perTile minus one.",
    ),
  turn: z
    .number()
    .optional()
    .describe(
      'Only pieces whose long axis points this way, in degrees from 0 to 180.',
    ),
});
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
    colors: z.array(PaintColorShape).max(128).default([]),
    repeat: z.array(z.number().int()).length(2).optional(),
  }),
  z.strictObject({ op: z.literal('replace'), draft: z.unknown() }),
  z.strictObject({ op: z.literal('goals'), goals: GoalsShape }),
]);
export type Edit = z.infer<typeof EditShape>;

/** A signed-in connection's lasting id, which owns its changes. */
export const Actor = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,64}$/)
  .optional();

export const EditRequest = z.strictObject({
  author: Author,
  actor: Actor,
  revision: z.number().int().min(1),
  label: z.string().trim().min(1).max(160).optional(),
  edit: EditShape,
  command: Command,
});

export const TravelRequest = z.strictObject({
  author: Author,
  actor: Actor,
  revision: z.number().int().min(1),
  direction: z.enum(['undo', 'redo']),
  steps: z.number().int().min(1).max(100).default(1),
  mine: z.boolean().default(true),
  command: Command,
});

export const NoteRequest = z.strictObject({
  answers: z.number().int().min(1).optional(),
  author: Author,
  text: z.string().max(4000),
  command: Command,
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
      return (d) => paint(d, edit.palette, edit.colors, edit.repeat);
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
export type { Mark };

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

export const ImportRequest = z.strictObject({
  author: Author,
  /** The exported zip, base64. */
  zip: z.string().max(22_000_000),
});

export const QuestionRequest = z.strictObject({
  author: Author,
  text: z.string().max(4000),
  about: z.string().min(1).max(180).optional(),
  command: Command,
});

/** The longest an agent's wait for an answer may be: under Codex's
 * 60-second tool limit, with room for the trip there and back. */
export const LONGEST_WAIT = 45;

type Commanded = { readonly author: string; readonly command?: string };

/** The receipt a retried command already has, or undefined for a new one. */
function repeatOf(p: Project, request: Commanded): Receipt | undefined {
  if (!request.command) return undefined;
  const key = `${request.author}\n${request.command}`;
  const found = p.receipts?.find((r) => r.key === key);
  if (found && found.hash !== fingerprint(request))
    throw new StudioError(
      `The command id “${request.command}” was already used for a different request. Use a new id for a new change.`,
    );
  return found;
}

function fingerprint(request: Commanded) {
  const { command: _command, ...rest } = request;
  return createHash('sha256').update(JSON.stringify(rest)).digest('hex');
}

function receipt(request: Commanded, revision: number, note?: number): Receipt {
  return {
    key: `${request.author}\n${request.command ?? ''}`,
    hash: fingerprint(request),
    revision,
    ...(note !== undefined ? { note } : {}),
    at: new Date().toISOString(),
  };
}

const keep = (p: Project, request: Commanded, note?: number) =>
  request.command ? withReceipt(p, receipt(request, p.revision, note)) : p;

const repeated = (r: Receipt) => ({
  repeated: {
    revision: r.revision,
    note: 'This command id was already done, so nothing was done again.',
  },
});

export class Studio {
  private locks = new Map<string, Promise<unknown>>();
  private listeners = new Set<Listener>();
  readonly backend: Backend;

  constructor(
    readonly root: string,
    private tutorials: string,
    backend?: Backend,
  ) {
    this.backend = backend ?? new FileBackend(root);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private load(id: string, drafts = 0) {
    return this.backend.load(id, drafts);
  }

  private announce(event: StudioEvent) {
    for (const listener of this.listeners) listener(event);
  }

  /**
   * Runs one change of one project at a time in this process, saves it and
   * announces it. When another server saved the project first (the hosted
   * studio may run several), the change runs again on the newer project,
   * where a stale edit is then refused as usual.
   */
  private update(
    id: string,
    step: (p: Project) => Project,
    kind: StudioEvent['kind'] = 'drawing',
    drafts = 0,
  ): Promise<Project> {
    const run = (this.locks.get(id) ?? Promise.resolve()).then(async () => {
      for (let attempt = 0; ; attempt++) {
        const before = await this.load(id, drafts);
        const next = step(before);
        // A retried command changes nothing and is not announced.
        if (next === before) return next;
        try {
          await this.backend.commit(before, next);
        } catch (e) {
          if (e instanceof Conflict && attempt < 4) continue;
          if (e instanceof Conflict)
            throw new StudioError(
              'The project is busy; try again in a moment.',
            );
          throw e;
        }
        this.announce({ project: id, revision: next.revision, kind });
        return next;
      }
    });
    this.locks.set(
      id,
      run.catch(() => undefined),
    );
    return run;
  }

  list() {
    return this.backend.list();
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
    const id = await this.freshId(request.title);
    draft = { ...draft, id };
    const project = newProject(id, draft, request.author, request.goals ?? {});
    await this.backend.create(project);
    return this.view(id);
  }

  private async freshId(title: string) {
    for (;;) {
      const id = `${slug(title)}-${randomBytes(2).toString('hex')}`;
      if (!(await this.backend.exists(id))) return id;
    }
  }

  /**
   * What a page polls: the revision, and stamps for notes, photo and marks.
   * Given the revision the page has, a newer drawing comes in the same
   * answer, so a page told of a change fetches once, not twice in a row.
   */
  async pulse(id: string, since?: number) {
    const [pulse, marks] = await Promise.all([
      this.backend.pulse(id),
      this.backend.marks(id),
    ]);
    return {
      project: id,
      revision: pulse.revision,
      stamp: pulse.stamp,
      marks: marks.map((m) => m.id).join(','),
      ...(since !== undefined && pulse.revision > since
        ? { latest: await this.draft(id) }
        : {}),
    };
  }

  /**
   * The project as a zip of the files the local studio keeps: project.json
   * (the drawing with its history and notes), pattern.json (a pattern file
   * Tastir's import opens) and the reference photo, as a backup or to move
   * it between the local and the hosted studio.
   */
  async exportZip(id: string) {
    const p = await this.load(id, 1000);
    // Row ids from the database are not part of the file.
    const plain = (e: Project['current']) => ({
      draft: e.draft,
      action: e.action,
    });
    const file: Project = {
      ...p,
      current: plain(p.current),
      past: p.past.map(plain),
      future: p.future.map(plain),
    };
    const files: Record<string, Uint8Array> = {
      'project.json': strToU8(JSON.stringify(file, null, 2)),
      'pattern.json': strToU8(
        `${JSON.stringify({ tastir: 'pattern', version: 1, tutorial: p.current.draft }, null, 2)}\n`,
      ),
    };
    if (p.reference)
      files[p.reference.file] = await this.backend.getPhoto(
        id,
        p.reference.file,
      );
    return {
      name: `${id}.zip`,
      bytes: Buffer.from(zipSync(files, { level: 6 })),
    };
  }

  /** A project from an exported zip, as a new project beside the others. */
  async importZip(request: z.infer<typeof ImportRequest>) {
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(Buffer.from(request.zip, 'base64'));
    } catch {
      throw new StudioError('That is not a studio project zip.');
    }
    let p: unknown;
    try {
      p = JSON.parse(strFromU8(files['project.json'] ?? new Uint8Array()));
    } catch {
      throw new StudioError('The zip has no project.json.');
    }
    if (!isProject(p))
      throw new StudioError('The project.json in the zip cannot be read.');
    const id = await this.freshId(p.title);
    const reference = p.reference;
    const photo = reference ? files[reference.file] : undefined;
    if (reference && (!photo || !/^reference\.(png|jpg)$/.test(reference.file)))
      throw new StudioError('The zip names a photo it does not hold.');
    const at = new Date().toISOString();
    const project: Project = {
      ...p,
      id,
      updated: at,
      current: {
        draft: { ...p.current.draft, id },
        action: p.current.action,
      },
      notes: [
        ...p.notes,
        {
          id: (p.notes.at(-1)?.id ?? 0) + 1,
          author: request.author,
          text: `Imported from ${p.id}.`,
          at,
        },
      ],
    };
    await this.backend.create(project);
    if (reference && photo)
      await this.backend.putPhoto(id, reference.file, Buffer.from(photo));
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
    const before = (await this.load(id)).reference;
    await this.backend.putPhoto(id, file, bytes);
    if (before && before.file !== file)
      await this.backend.removePhoto(id, before.file);
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
      const photo = await this.backend.getPhoto(id, ref.file);
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
    // A chat app limits how big a tool's answer may be, so a picture that
    // would be over about 100,000 characters as base64 is drawn smaller.
    let pixels = Math.max(200, Math.min(1600, size));
    let picture = png(text, pixels);
    while (picture.length * (4 / 3) > 100_000 && pixels > 200) {
      pixels = Math.max(200, Math.round(pixels * 0.8));
      picture = png(text, pixels);
    }
    return { revision: p.revision, png: picture, size: pixels };
  }

  async edit(id: string, request: z.infer<typeof EditRequest>) {
    const { edit } = request;
    let again: Receipt | undefined;
    await this.update(id, (p) => {
      again = repeatOf(p, request);
      if (again) return p;
      const next = applyEdit(
        p,
        request.revision,
        request.author,
        request.label ?? labelOf(edit),
        change(edit),
        undefined,
        request.actor,
      );
      return keep(
        edit.op === 'goals' ? { ...next, goals: edit.goals as Goals } : next,
        request,
      );
    });
    const view = await this.view(id);
    return again ? { ...view, ...repeated(again) } : view;
  }

  async travel(id: string, request: z.infer<typeof TravelRequest>) {
    let again: Receipt | undefined;
    await this.update(
      id,
      (p) => {
        again = repeatOf(p, request);
        if (again) return p;
        return keep(
          travel(
            p,
            request.revision,
            request.author,
            request.direction,
            request.steps,
            request.mine,
            undefined,
            request.actor,
          ),
          request,
        );
      },
      'drawing',
      // Undo and Redo need the drawings they go back or forward to.
      request.steps,
    );
    const view = await this.view(id);
    return again ? { ...view, ...repeated(again) } : view;
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
    let again: Receipt | undefined;
    const p = await this.update(
      id,
      (p) => {
        again = repeatOf(p, request);
        if (again) return p;
        const next = addNote(p, request.author, request.text, undefined, {
          ...(request.answers !== undefined
            ? { answers: request.answers }
            : {}),
        });
        return keep(next, request, next.notes.at(-1)?.id);
      },
      'notes',
    );
    const done = again;
    return done
      ? {
          project: p.id,
          note: p.notes.find((n) => n.id === done.note),
          ...repeated(done),
        }
      : { project: p.id, note: p.notes.at(-1) };
  }

  /** Asks the owner something, marking the element it is about. */
  async ask(id: string, request: z.infer<typeof QuestionRequest>) {
    const earlier = repeatOf(await this.load(id), request);
    if (request.about && !earlier)
      await this.point(id, {
        author: request.author,
        target: request.about,
        label: 'Question',
      });
    let again: Receipt | undefined;
    const p = await this.update(
      id,
      (p) => {
        again = repeatOf(p, request);
        if (again) return p;
        const next = addNote(p, request.author, request.text, undefined, {
          question: true,
          ...(request.about ? { about: request.about } : {}),
        });
        return keep(next, request, next.notes.at(-1)?.id);
      },
      'notes',
    );
    const done = again;
    return done
      ? {
          project: p.id,
          question: p.notes.find((n) => n.id === done.note)!,
          ...repeated(done),
        }
      : { project: p.id, question: p.notes.at(-1)! };
  }

  /**
   * The answer to a question, waiting up to `seconds` for it. It hears an
   * answer given through this server at once, and checks the project every
   * second for one given through another.
   */
  async answer(id: string, question: number, seconds: number) {
    const find = async () =>
      (await this.load(id)).notes.find((n) => n.answers === question);
    const asked = (await this.load(id)).notes.find(
      (n) => n.id === question && n.question,
    );
    if (!asked) throw new StudioError(`There is no question ${question}.`);
    const now = await find();
    if (now || seconds <= 0) return { question, answer: now ?? null };
    const until = Date.now() + Math.min(seconds, LONGEST_WAIT) * 1000;
    return new Promise<{
      question: number;
      answer: Awaited<ReturnType<typeof find>> | null;
    }>((resolve) => {
      let finished = false;
      const done = (answer: Awaited<ReturnType<typeof find>> | null) => {
        if (finished) return;
        finished = true;
        clearInterval(timer);
        stop();
        resolve({ question, answer });
      };
      const look = () =>
        void find()
          .then((a) => (a ? done(a) : Date.now() >= until && done(null)))
          .catch(() => done(null));
      const stop = this.subscribe((event) => {
        if (event.project === id && event.kind === 'notes') look();
      });
      const timer = setInterval(look, 1000);
    });
  }

  async marks(id: string) {
    return { project: id, marks: await this.backend.marks(id) };
  }

  /** Marks a named element; a newer mark on the same element replaces it. */
  async point(id: string, request: z.infer<typeof MarkRequest>) {
    const p = await this.load(id);
    const { scene } = check(p.current.draft);
    if (!scene.elements.has(request.target))
      throw new StudioError(
        `There is no element “${request.target}” to point at. Use a name from inspect.`,
      );
    const mark = await this.backend.putMark(id, {
      ...request,
      at: new Date().toISOString(),
    });
    this.announce({ project: id, revision: p.revision, kind: 'marks' });
    return { project: id, mark };
  }

  /** Clears marks: one author's, or everyone's. */
  async clearMarks(id: string, author?: string) {
    const p = await this.load(id);
    await this.backend.clearMarks(id, author);
    this.announce({ project: id, revision: p.revision, kind: 'marks' });
    return this.marks(id);
  }
}
