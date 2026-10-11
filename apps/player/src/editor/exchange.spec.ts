import { JALI_FINISHES } from '../app/jali';
import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  decodeShared,
  encodeShared,
  readPattern,
  MAX_FILE_BYTES,
} from './files';
import { emptyDraft } from './document';

const link = (data: unknown, prefix = 'j') =>
  prefix +
  btoa(JSON.stringify(data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

it.each([
  {
    library: 'eight-fold-star-and-cross',
    design: { coloring: { palette: 'Fès tile' } },
  },
  { library: 'eight-fold-star-and-cross', tutorial: {} },
  { tutorial: { title: 'Broken', steps: [null] } },
  { library: 'eight-fold-star-and-cross', basedOn: { step: -1 } },
])('rejects a malformed shared payload before rendering: %j', async (data) => {
  expect(await decodeShared(link(data))).toBeUndefined();
});
it('accepts existing library links without design overrides', async () => {
  expect(
    await decodeShared(link({ library: 'eight-fold-star-and-cross' })),
  ).toEqual({ library: 'eight-fold-star-and-cross' });
});
it('rejects an unknown encoding and truncated payload', async () => {
  expect(await decodeShared(link({ library: 'star' }, 'x'))).toBeUndefined();
  expect(await decodeShared('jeyJsaWJyYXJ5Ijo')).toBeUndefined();
});
it.each(['tiles', 'jali'] as const)(
  'round trips compressed Unicode %s designs',
  async (look) => {
    const shared = {
      library: 'eight-fold-star-and-cross',
      design: {
        name: 'تسطير — My pattern',
        coloring: { palette: 'Fès tile', chosen: { star: '#ffffff' } },
        look,
        grout: 1,
      },
    };
    expect(await decodeShared(await encodeShared(shared))).toEqual(shared);
  },
);
it('preserves an unfinished draft but refuses unsupported file versions', () => {
  const tutorial = emptyDraft('my-pattern', 'My pattern');
  expect(
    readPattern(JSON.stringify({ tastir: 'pattern', version: 1, tutorial })),
  ).toEqual({ pattern: true, tutorial });
  expect(
    readPattern(JSON.stringify({ tastir: 'pattern', version: 2, tutorial })),
  ).toHaveProperty('reason', expect.stringContaining('unsupported version'));
});
it('refuses oversized files and damaged metadata', () => {
  expect(readPattern(' '.repeat(MAX_FILE_BYTES + 1))).toHaveProperty(
    'reason',
    expect.stringContaining('too large'),
  );
  expect(
    readPattern(
      JSON.stringify({
        tastir: 'pattern',
        version: 1,
        tutorial: example,
        basedOn: { title: 7 },
      }),
    ),
  ).toHaveProperty('reason', expect.stringContaining('source information'));
});

it('refuses to create a link its reader would reject as too large', async () => {
  await expect(
    encodeShared({ library: 'x'.repeat(MAX_FILE_BYTES) }),
  ).rejects.toThrow('pattern file');
});

it.each(['stone', 'wood', 'metal'] as const)(
  'round trips a custom %s finish and rejects malformed settings',
  async (material) => {
    const shared = {
      library: 'eight-fold-star-and-cross',
      design: {
        name: 'My Jali',
        coloring: { palette: 'Fès tile', chosen: {} },
        look: 'jali' as const,
        grout: 1,
        jali: {
          material,
          finish: 'custom' as const,
          framework: '#864b31',
          background: '#234a79',
        },
      },
    };
    expect(await decodeShared(await encodeShared(shared))).toEqual(shared);
    for (const bad of [
      { ...shared.design.jali, material: 'plastic' },
      {
        ...shared.design.jali,
        finish: material === 'wood' ? 'marble' : 'walnut',
      },
      { ...shared.design.jali, framework: '#fff' },
      { ...shared.design.jali, background: '" onload="bad' },
    ]) {
      expect(
        await decodeShared(
          link({ ...shared, design: { ...shared.design, jali: bad } }),
        ),
      ).toBeUndefined();
    }
  },
);

it.each(['gold', 'silver', 'wood', 'stone'])(
  'reads legacy shared %s finishes without changing colors',
  async (material) => {
    const jali = { material, framework: '#864b31', background: '#234a79' };
    const decoded = await decodeShared(
      link({
        library: 'eight-fold-star-and-cross',
        design: {
          name: 'Old Jali',
          coloring: { palette: 'Fès tile', chosen: {} },
          look: 'jali',
          grout: 1,
          jali,
        },
      }),
    );
    expect(decoded?.design?.jali).toMatchObject({
      framework: jali.framework,
      background: jali.background,
      material: ['gold', 'silver'].includes(material) ? 'metal' : material,
    });
  },
);

it.each(JALI_FINISHES)(
  'retains the $finish preset in a shared design',
  async ({ material, finish, color }) => {
    const shared = {
      library: 'eight-fold-star-and-cross',
      design: {
        name: 'Preset',
        coloring: { palette: 'Fès tile', chosen: {} },
        look: 'jali' as const,
        grout: 1,
        jali: { material, finish, framework: color, background: '#708d87' },
      },
    };
    expect(await decodeShared(await encodeShared(shared))).toEqual(shared);
  },
);
