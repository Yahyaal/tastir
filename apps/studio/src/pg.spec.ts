import { join } from 'node:path';
import { Studio } from './studio.js';
import { BACKENDS, testBackend, type TestBackend } from './testing.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');
const circle = (name: string) => ({
  kind: 'circle',
  name,
  centre: 'O',
  through: 'A',
});

describe.each(BACKENDS.filter((k) => k !== 'files'))(
  'the studio in Postgres (%s)',
  (kind) => {
    let store: TestBackend;
    beforeEach(async () => {
      store = await testBackend(kind);
    });
    afterEach(() => store.close());

    it('saves one of two edits based on the same revision, from two servers', async () => {
      // Two servers on one database, as Vercel may run.
      const one = new Studio(store.root, tutorials, store.backend);
      const two = new Studio(store.root, tutorials, await store.make());
      const made = await one.create({ author: 'owner', title: 'Race' });
      const id = made.project;
      const results = await Promise.allSettled([
        one.edit(id, {
          author: 'claude',
          revision: 1,
          edit: { op: 'construct', add: [circle('C1')], remove: [] },
        }),
        two.edit(id, {
          author: 'codex',
          revision: 1,
          edit: { op: 'construct', add: [circle('C2')], remove: [] },
        }),
      ]);
      const saved = results.filter((r) => r.status === 'fulfilled');
      const refused = results.filter((r) => r.status === 'rejected');
      expect(saved).toHaveLength(1);
      expect(refused).toHaveLength(1);
      expect(String((refused[0] as PromiseRejectedResult).reason)).toMatch(
        /changed since revision 1/,
      );
      const view = await two.view(id);
      expect(view.revision).toBe(2);
      expect(view.history.undo).toHaveLength(1);
      expect(view.drawing.steps).toHaveLength(1);
    });

    it('keeps notes posted at the same moment through two servers', async () => {
      const one = new Studio(store.root, tutorials, store.backend);
      const two = new Studio(store.root, tutorials, await store.make());
      const id = (await one.create({ author: 'owner', title: 'Notes' }))
        .project;
      await Promise.all([
        one.note(id, { author: 'claude', text: 'First.' }),
        two.note(id, { author: 'codex', text: 'Second.' }),
      ]);
      const notes = (await one.notes(id)).notes;
      expect(notes.map((n) => n.id)).toEqual([1, 2]);
      expect(new Set(notes.map((n) => n.author))).toEqual(
        new Set(['claude', 'codex']),
      );
    });

    it('reads old drawings only for Undo and Redo, and they come back whole', async () => {
      const studio = new Studio(store.root, tutorials, store.backend);
      const id = (await studio.create({ author: 'owner', title: 'History' }))
        .project;
      for (let i = 1; i <= 3; i++)
        await studio.edit(id, {
          author: 'claude',
          revision: i,
          edit: { op: 'construct', add: [circle(`C${i}`)], remove: [] },
        });
      // An ordinary load leaves the old drawings unread.
      const light = await store.backend.load(id);
      expect(light.past.every((e) => !('steps' in e.draft))).toBe(true);
      expect(light.current.draft.steps).toHaveLength(3);

      await studio.travel(id, {
        author: 'claude',
        revision: 4,
        direction: 'undo',
        steps: 2,
        mine: true,
      });
      expect((await studio.draft(id)).draft.steps).toHaveLength(1);
      await studio.travel(id, {
        author: 'claude',
        revision: 5,
        direction: 'redo',
        steps: 1,
        mine: true,
      });
      const view = await studio.view(id);
      expect(view.drawing.steps).toHaveLength(2);
      expect(view.history.undo.map((e) => e.label)).toEqual([
        'Added C2',
        'Added C1',
      ]);
      expect(view.history.redo.map((e) => e.label)).toEqual(['Added C3']);

      // A new edit clears the redo steps, which are gone from the database.
      await studio.edit(id, {
        author: 'owner',
        revision: 6,
        edit: { op: 'construct', add: [circle('D')], remove: [] },
      });
      const after = await store.backend.load(id, 10);
      expect(after.future).toEqual([]);
      expect(after.past.map((e) => e.draft.steps.length)).toEqual([0, 1, 2]);
    });

    it('keeps marks and the reference photo in the database', async () => {
      const studio = new Studio(store.root, tutorials, store.backend);
      const id = (await studio.create({ author: 'owner', title: 'Marks' }))
        .project;
      await studio.edit(id, {
        author: 'claude',
        revision: 1,
        edit: { op: 'construct', add: [circle('C0')], remove: [] },
      });
      await studio.point(id, { author: 'claude', target: 'C0', label: 'Here' });
      await studio.point(id, { author: 'claude', target: 'C0', label: 'Now' });
      // Another server sees the same marks.
      const other = new Studio(store.root, tutorials, await store.make());
      expect((await other.marks(id)).marks.map((m) => m.label)).toEqual([
        'Now',
      ]);
      await other.clearMarks(id, 'claude');
      expect((await studio.marks(id)).marks).toEqual([]);

      await studio.setReference(id, {
        author: 'owner',
        path: 'apps/player/public/photos/cairo-minbar-doors-met.jpg',
      });
      const picture = await other.picture(id, 'reference', 400);
      expect(picture.png.subarray(1, 4).toString()).toBe('PNG');
    });
  },
);
