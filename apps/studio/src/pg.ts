import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import {
  bigserial,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { StudioError, type Goals } from './ops.js';
import type { Draft } from './player.js';
import type { Entry, Note, Project, Receipt } from './project.js';
import type { Reference } from './reference.js';
import { Conflict, type Backend, type Mark } from './backend.js';

/**
 * The studio's projects in Postgres, for the hosted studio. A project is a
 * row with its current revision; each step of its history is a row in
 * `entries`, so loading a project reads the current drawing but not a
 * hundred old ones, and a save writes only what changed. Every save checks
 * the project's version in the same transaction, so two servers saving the
 * same project at once cannot both succeed.
 */
const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  created: text('created').notNull(),
  updated: text('updated').notNull(),
  revision: integer('revision').notNull(),
  /** Goes up on every save, notes included, unlike the revision. */
  version: integer('version').notNull(),
  goals: jsonb('goals').$type<Goals>().notNull(),
  reference: jsonb('reference').$type<Reference>(),
});

export const entries = pgTable(
  'entries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    project: text('project')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** past (undo), current, or future (redo). */
    stack: text('stack').$type<'past' | 'current' | 'future'>().notNull(),
    /** The order within its stack: oldest first for past, next first for future. */
    ord: integer('ord').notNull(),
    draft: jsonb('draft').$type<Draft>().notNull(),
    author: text('author').notNull(),
    label: text('label').notNull(),
    at: text('at').notNull(),
    actor: text('actor'),
  },
  (t) => [index('entries_project').on(t.project, t.stack, t.ord)],
);

export const notes = pgTable(
  'notes',
  {
    project: text('project')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    id: integer('id').notNull(),
    note: jsonb('note').$type<Note>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.project, t.id] })],
);

export const receipts = pgTable(
  'receipts',
  {
    project: text('project')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    receipt: jsonb('receipt').$type<Receipt>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.project, t.key] })],
);

export const marks = pgTable(
  'marks',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    project: text('project')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    author: text('author').notNull(),
    target: text('target').notNull(),
    label: text('label').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('marks_project').on(t.project)],
);

export const photos = pgTable(
  'photos',
  {
    project: text('project')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    file: text('file').notNull(),
    bytes: bytea('bytes').notNull(),
  },
  (t) => [primaryKey({ columns: [t.project, t.file] })],
);

/** Agents' apps, registered by themselves or known by their metadata address. */
export const oauthClients = pgTable('oauth_clients', {
  id: text('id').primaryKey(),
  info: jsonb('info').$type<Record<string, unknown>>().notNull(),
  fetched: timestamp('fetched', { withTimezone: true }).notNull().defaultNow(),
});

/** One approval by the owner: a lasting identity that owns its edits. */
export const connections = pgTable('connections', {
  id: text('id').primaryKey(),
  client: text('client').notNull(),
  name: text('name').notNull(),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  used: timestamp('used', { withTimezone: true }),
  revoked: timestamp('revoked', { withTimezone: true }),
});

/** A sign-in waiting for the owner's Allow or Deny. */
export const authRequests = pgTable('auth_requests', {
  id: text('id').primaryKey(),
  client: text('client').notNull(),
  redirect: text('redirect').notNull(),
  challenge: text('challenge').notNull(),
  state: text('state'),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

/** Codes and tokens, kept only as hashes. */
export const authCodes = pgTable('auth_codes', {
  hash: text('hash').primaryKey(),
  client: text('client').notNull(),
  connection: text('connection')
    .notNull()
    .references(() => connections.id, { onDelete: 'cascade' }),
  redirect: text('redirect').notNull(),
  challenge: text('challenge').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const tokens = pgTable(
  'tokens',
  {
    hash: text('hash').primaryKey(),
    kind: text('kind').$type<'access' | 'refresh'>().notNull(),
    client: text('client').notNull(),
    connection: text('connection')
      .notNull()
      .references(() => connections.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => [index('tokens_connection').on(t.connection)],
);

const schema = {
  projects,
  entries,
  notes,
  receipts,
  marks,
  photos,
  oauthClients,
  connections,
  authRequests,
  authCodes,
  tokens,
};
// postgres.js and PGlite both give a database of this shape.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type Place = { stack: 'past' | 'current' | 'future'; ord: number };
interface Loaded {
  version: number;
  places: Map<string, Place>;
}

/** An entry's row id, kept on the entry while it moves between stacks. */
type Keyed = Entry & { readonly key?: string };
const keyOf = (e: Entry) => (e as Keyed).key;

/** A history step whose drawing was not read; only Undo and Redo need it. */
const UNREAD = Object.freeze({}) as Draft;

export class PgBackend implements Backend {
  private loaded = new WeakMap<Project, Loaded>();

  constructor(
    readonly db: Db,
    readonly root: string,
    private readonly end: () => Promise<void> = async () => undefined,
  ) {}

  async list() {
    return this.db
      .select({
        id: projects.id,
        title: projects.title,
        updated: projects.updated,
        revision: projects.revision,
      })
      .from(projects)
      .orderBy(desc(projects.updated));
  }

  async exists(id: string) {
    const [row] = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, id));
    return !!row;
  }

  async load(id: string, drafts = 0): Promise<Project> {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    if (!row) throw new StudioError(`There is no project “${id}”.`);
    const steps = await this.db
      .select({
        id: entries.id,
        stack: entries.stack,
        ord: entries.ord,
        author: entries.author,
        label: entries.label,
        at: entries.at,
        actor: entries.actor,
      })
      .from(entries)
      .where(eq(entries.project, id))
      .orderBy(asc(entries.ord));
    const past = steps.filter((s) => s.stack === 'past');
    const future = steps.filter((s) => s.stack === 'future');
    const current = steps.find((s) => s.stack === 'current');
    if (!current) throw new StudioError(`The project “${id}” has no drawing.`);
    const wanted = [
      current.id,
      ...past
        .slice(past.length - Math.min(drafts, past.length))
        .map((s) => s.id),
      ...future.slice(0, drafts).map((s) => s.id),
    ];
    const read = new Map(
      (
        await this.db
          .select({ id: entries.id, draft: entries.draft })
          .from(entries)
          .where(inArray(entries.id, wanted))
      ).map((r) => [r.id, r.draft]),
    );
    const entry = (s: (typeof steps)[number]): Entry =>
      ({
        key: String(s.id),
        draft: read.get(s.id) ?? UNREAD,
        action: {
          author: s.author,
          label: s.label,
          at: s.at,
          ...(s.actor ? { actor: s.actor } : {}),
        },
      }) as Keyed;
    const noteRows = await this.db
      .select({ note: notes.note })
      .from(notes)
      .where(eq(notes.project, id))
      .orderBy(asc(notes.id));
    const receiptRows = await this.db
      .select({ receipt: receipts.receipt })
      .from(receipts)
      .where(eq(receipts.project, id));
    const project: Project = {
      format: 1,
      id: row.id,
      title: row.title,
      created: row.created,
      updated: row.updated,
      goals: row.goals,
      revision: row.revision,
      current: entry(current),
      past: past.map(entry),
      future: future.map(entry),
      notes: noteRows.map((r) => r.note),
      ...(row.reference ? { reference: row.reference } : {}),
      ...(receiptRows.length
        ? {
            receipts: receiptRows
              .map((r) => r.receipt)
              .sort((a, b) => a.at.localeCompare(b.at)),
          }
        : {}),
    };
    this.loaded.set(project, {
      version: row.version,
      places: new Map(
        steps.map((s) => [String(s.id), { stack: s.stack, ord: s.ord }]),
      ),
    });
    return project;
  }

  async create(project: Project) {
    await this.db.transaction(async (tx) => {
      await tx.insert(projects).values({
        id: project.id,
        title: project.title,
        created: project.created,
        updated: project.updated,
        revision: project.revision,
        version: 1,
        goals: project.goals,
        reference: project.reference ?? null,
      });
      await tx.insert(entries).values({
        project: project.id,
        stack: 'current',
        ord: 0,
        draft: project.current.draft,
        ...project.current.action,
      });
    });
  }

  async commit(before: Project, next: Project) {
    const loaded = this.loaded.get(before);
    if (!loaded)
      throw new Error('A project must be loaded before it is saved.');
    await this.db.transaction(async (tx) => {
      const saved = await tx
        .update(projects)
        .set({
          title: next.title,
          updated: next.updated,
          revision: next.revision,
          version: loaded.version + 1,
          goals: next.goals,
          reference: next.reference ?? null,
        })
        .where(
          and(eq(projects.id, next.id), eq(projects.version, loaded.version)),
        )
        .returning({ id: projects.id });
      if (!saved.length) throw new Conflict();

      // Where every step of the history should now be. Steps only come and
      // go at the ends of each stack, so the ones that stay keep their place.
      const want = new Map<Entry, Place>([
        [next.current, { stack: 'current', ord: 0 }],
      ]);
      let last = -Infinity;
      for (const e of next.past) {
        const was = keyOf(e) ? loaded.places.get(keyOf(e)!) : undefined;
        const ord =
          was?.stack === 'past' && was.ord > last
            ? was.ord
            : last === -Infinity
              ? 0
              : last + 1;
        want.set(e, { stack: 'past', ord });
        last = ord;
      }
      let first = Infinity;
      for (const e of [...next.future].reverse()) {
        const was = keyOf(e) ? loaded.places.get(keyOf(e)!) : undefined;
        const ord =
          was?.stack === 'future' && was.ord < first
            ? was.ord
            : first === Infinity
              ? 0
              : first - 1;
        want.set(e, { stack: 'future', ord });
        first = ord;
      }
      const kept = new Set<string>();
      for (const [e, place] of want) {
        const key = keyOf(e);
        if (!key) {
          if (e.draft === UNREAD)
            throw new Error('A history step was saved without its drawing.');
          await tx.insert(entries).values({
            project: next.id,
            ...place,
            draft: e.draft,
            ...e.action,
          });
          continue;
        }
        kept.add(key);
        const was = loaded.places.get(key);
        if (was?.stack !== place.stack || was.ord !== place.ord)
          await tx
            .update(entries)
            .set(place)
            .where(eq(entries.id, Number(key)));
      }
      const gone = [...loaded.places.keys()].filter((k) => !kept.has(k));
      if (gone.length)
        await tx.delete(entries).where(inArray(entries.id, gone.map(Number)));

      const hadNotes = new Set(before.notes.map((n) => n.id));
      const hasNotes = new Set(next.notes.map((n) => n.id));
      const newNotes = next.notes.filter((n) => !hadNotes.has(n.id));
      if (newNotes.length)
        await tx
          .insert(notes)
          .values(
            newNotes.map((n) => ({ project: next.id, id: n.id, note: n })),
          );
      const oldNotes = [...hadNotes].filter((n) => !hasNotes.has(n));
      if (oldNotes.length)
        await tx
          .delete(notes)
          .where(and(eq(notes.project, next.id), inArray(notes.id, oldNotes)));

      const hadKeys = new Set((before.receipts ?? []).map((r) => r.key));
      const hasKeys = new Set((next.receipts ?? []).map((r) => r.key));
      const newReceipts = (next.receipts ?? []).filter(
        (r) => !hadKeys.has(r.key),
      );
      if (newReceipts.length)
        await tx.insert(receipts).values(
          newReceipts.map((r) => ({
            project: next.id,
            key: r.key,
            receipt: r,
          })),
        );
      const oldReceipts = [...hadKeys].filter((k) => !hasKeys.has(k));
      if (oldReceipts.length)
        await tx
          .delete(receipts)
          .where(
            and(
              eq(receipts.project, next.id),
              inArray(receipts.key, oldReceipts),
            ),
          );
    });
  }

  async putPhoto(id: string, file: string, bytes: Buffer) {
    await this.db
      .insert(photos)
      .values({ project: id, file, bytes })
      .onConflictDoUpdate({
        target: [photos.project, photos.file],
        set: { bytes },
      });
  }

  async getPhoto(id: string, file: string) {
    const [row] = await this.db
      .select({ bytes: photos.bytes })
      .from(photos)
      .where(and(eq(photos.project, id), eq(photos.file, file)));
    if (!row) throw new StudioError('The reference photo is missing.');
    return Buffer.from(row.bytes);
  }

  async removePhoto(id: string, file: string) {
    await this.db
      .delete(photos)
      .where(and(eq(photos.project, id), eq(photos.file, file)));
  }

  async marks(id: string) {
    await this.db
      .delete(marks)
      .where(lt(marks.at, sql`now() - interval '1 hour'`));
    const rows = await this.db
      .select()
      .from(marks)
      .where(
        and(
          eq(marks.project, id),
          gt(marks.at, sql`now() - interval '1 hour'`),
        ),
      )
      .orderBy(asc(marks.id));
    return rows.map((r): Mark => ({
      id: r.id,
      author: r.author,
      target: r.target,
      label: r.label,
      at: r.at.toISOString(),
    }));
  }

  async putMark(id: string, mark: Omit<Mark, 'id'>) {
    return this.db.transaction(async (tx) => {
      await tx
        .delete(marks)
        .where(and(eq(marks.project, id), eq(marks.target, mark.target)));
      const [made] = await tx
        .insert(marks)
        .values({
          project: id,
          author: mark.author,
          target: mark.target,
          label: mark.label,
          at: new Date(mark.at),
        })
        .returning();
      const all = await tx
        .select({ id: marks.id })
        .from(marks)
        .where(eq(marks.project, id))
        .orderBy(desc(marks.id));
      const extra = all.slice(12).map((m) => m.id);
      if (extra.length) await tx.delete(marks).where(inArray(marks.id, extra));
      return { ...mark, id: made!.id };
    });
  }

  async clearMarks(id: string, author?: string) {
    await this.db
      .delete(marks)
      .where(
        author
          ? and(eq(marks.project, id), eq(marks.author, author))
          : eq(marks.project, id),
      );
  }

  close() {
    return this.end();
  }
}

/** The migrations folder, made by drizzle-kit from the tables above. */
export const MIGRATIONS = new URL('../drizzle', import.meta.url).pathname;

/**
 * A Postgres backend over postgres.js, as finsight connects to Neon:
 * prepared statements off, because Neon's pooled address does not keep
 * them between requests.
 */
export async function connectPostgres(url: string, root: string) {
  const { default: postgres } = await import('postgres');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const client = postgres(url, {
    prepare: false,
    max: 5,
    onnotice: () => undefined,
  });
  return new PgBackend(drizzle(client, { schema }) as unknown as Db, root, () =>
    client.end(),
  );
}

/** Brings the database's tables up to date. */
export async function migratePostgres(url: string) {
  const { default: postgres } = await import('postgres');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');
  const client = postgres(url, {
    prepare: false,
    max: 1,
    onnotice: () => undefined,
  });
  try {
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS });
  } finally {
    await client.end();
  }
}
