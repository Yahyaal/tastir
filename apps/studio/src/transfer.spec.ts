import { join } from 'node:path';
import { Studio } from './studio.js';
import { testBackend, type TestBackend } from './testing.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');
const circle = (name: string) => ({
  kind: 'circle',
  name,
  centre: 'O',
  through: 'A',
});

describe('moving a project between the local and the hosted studio', () => {
  let files: TestBackend;
  let pg: TestBackend;
  beforeEach(async () => {
    files = await testBackend('files');
    pg = await testBackend('pglite');
  });
  afterEach(async () => {
    await files.close();
    await pg.close();
  });

  for (const [from, to] of [
    ['files', 'pglite'],
    ['pglite', 'files'],
  ] as const) {
    it(`exports from ${from} and imports into ${to} with its history, notes and photo`, async () => {
      const store = (kind: string) => (kind === 'files' ? files : pg);
      const one = new Studio(store(from).root, tutorials, store(from).backend);
      const two = new Studio(store(to).root, tutorials, store(to).backend);
      const id = (await one.create({ author: 'owner', title: 'Moving' }))
        .project;
      for (let i = 1; i <= 2; i++)
        await one.edit(id, {
          author: 'claude',
          revision: i,
          edit: { op: 'construct', add: [circle(`C${i}`)], remove: [] },
        });
      await one.travel(id, {
        author: 'claude',
        revision: 3,
        direction: 'undo',
        steps: 1,
        mine: true,
      });
      await one.note(id, { author: 'claude', text: 'Two circles.' });
      await one.setReference(id, {
        author: 'owner',
        path: 'apps/player/public/photos/cairo-minbar-doors-met.jpg',
      });
      const zip = await one.exportZip(id);
      const made = await two.importZip({
        author: 'owner',
        zip: zip.bytes.toString('base64'),
      });
      expect(made.project).not.toBe(id);
      expect(made.drawing.steps).toHaveLength(1);
      expect(made.history.undo.map((e) => e.label)).toEqual(['Added C1']);
      expect(made.history.redo.map((e) => e.label)).toEqual(['Added C2']);
      const notes = (await two.notes(made.project)).notes;
      expect(notes.map((n) => n.text)).toEqual([
        'Two circles.',
        `Imported from ${id}.`,
      ]);
      // Redo still brings back the second circle, from the moved history.
      await two.travel(made.project, {
        author: 'claude',
        revision: made.revision,
        direction: 'redo',
        steps: 1,
        mine: true,
      });
      expect((await two.draft(made.project)).draft.steps).toHaveLength(2);
      const photo = await two.picture(made.project, 'reference', 300);
      expect(photo.png.subarray(1, 4).toString()).toBe('PNG');
    });
  }

  it('refuses a zip that is not a project', async () => {
    const studio = new Studio(pg.root, tutorials, pg.backend);
    await expect(
      studio.importZip({ author: 'owner', zip: 'bm90IGEgemlw' }),
    ).rejects.toThrow(/not a studio project zip/);
  });

  it('changes the pulse when a note is posted, not only the drawing', async () => {
    for (const store of [files, pg]) {
      const studio = new Studio(store.root, tutorials, store.backend);
      const id = (await studio.create({ author: 'owner', title: 'Pulse' }))
        .project;
      const before = await studio.pulse(id);
      await studio.note(id, { author: 'claude', text: 'Hello.' });
      const after = await studio.pulse(id);
      expect(after.revision).toBe(before.revision);
      expect(after.stamp).not.toBe(before.stamp);
    }
  });

  it('sends a newer drawing with the pulse, so a page fetches once', async () => {
    for (const store of [files, pg]) {
      const studio = new Studio(store.root, tutorials, store.backend);
      const id = (await studio.create({ author: 'owner', title: 'Pulse' }))
        .project;
      const seen = (await studio.pulse(id)).revision;
      expect(await studio.pulse(id, seen)).not.toHaveProperty('latest');
      await studio.edit(id, {
        author: 'claude',
        revision: seen,
        edit: {
          op: 'construct',
          add: [{ kind: 'circle', name: 'C1', centre: 'O', through: 'A' }],
          remove: [],
        },
      });
      const pulse = await studio.pulse(id, seen);
      expect(pulse.latest).toEqual(await studio.draft(id));
      expect(pulse.latest?.revision).toBe(seen + 1);
      // Without the page's revision, the pulse stays small.
      expect(await studio.pulse(id)).not.toHaveProperty('latest');
    }
  });
});
