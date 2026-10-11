import {
  addDesign,
  deleteDesign,
  getDesign,
  listDesigns,
  renameDesign,
  updateDesign,
  type DesignFields,
} from './designs';

const fields: DesignFields = {
  name: 'Test',
  tutorial: 'eight-fold-star-and-cross',
  inked: ['0,0|1,0', '1,0|1,1'],
  coloring: { palette: 'Marrakech', chosen: { '8:0.5000': '#123456' } },
  look: 'strapwork',
  grout: 1.5,
};

describe('the design store', () => {
  it('saves a design and lists it', () => {
    expect(listDesigns()).toEqual([]);
    const saved = addDesign(fields);
    expect(saved?.id).toBeTruthy();
    expect(saved?.created).toBe(saved?.updated);
    expect(listDesigns()).toEqual([saved]);
  });

  it('reads a design back exactly as it was saved', () => {
    const saved = addDesign(fields);
    const read = getDesign(saved?.id ?? '');
    expect(read).toEqual(saved);
    expect(read).toMatchObject(fields);
    // Stored as plain JSON under one key.
    const raw = JSON.parse(
      window.localStorage.getItem('tastir.designs') ?? '',
    ) as unknown[];
    expect(raw).toHaveLength(1);
  });

  it('keeps Jali and its lattice width when saved and updated', () => {
    const saved = addDesign({ ...fields, look: 'jali', grout: 2 });
    expect(getDesign(saved?.id ?? '')).toMatchObject({
      look: 'jali',
      grout: 2,
    });
    updateDesign(saved?.id ?? '', { grout: 0.75 });
    expect(getDesign(saved?.id ?? '')).toMatchObject({
      look: 'jali',
      grout: 0.75,
    });
  });

  it('keeps the tutorial’s own inking as no pieces', () => {
    const saved = addDesign({ ...fields, inked: undefined });
    expect(getDesign(saved?.id ?? '')?.inked).toBeUndefined();
    const back = updateDesign(saved?.id ?? '', { inked: ['a|b'] });
    expect(back?.inked).toEqual(['a|b']);
    updateDesign(saved?.id ?? '', { inked: undefined });
    expect(getDesign(saved?.id ?? '')?.inked).toBeUndefined();
  });

  it('lists the latest changed first, and updates in place', async () => {
    const a = addDesign({ ...fields, name: 'A' });
    await new Promise((r) => setTimeout(r, 5));
    addDesign({ ...fields, name: 'B' });
    expect(listDesigns().map((d) => d.name)).toEqual(['B', 'A']);
    await new Promise((r) => setTimeout(r, 5));
    const changed = updateDesign(a?.id ?? '', {
      coloring: { palette: 'Isfahan', chosen: {} },
    });
    expect(changed?.created).toBe(a?.created);
    expect(changed?.updated).not.toBe(a?.updated);
    expect(listDesigns().map((d) => d.name)).toEqual(['A', 'B']);
    expect(getDesign(a?.id ?? '')?.coloring.palette).toBe('Isfahan');
  });

  it('renames and deletes', () => {
    const a = addDesign({ ...fields, name: 'A' });
    const b = addDesign({ ...fields, name: 'B' });
    renameDesign(a?.id ?? '', 'Mine');
    expect(getDesign(a?.id ?? '')?.name).toBe('Mine');
    expect(deleteDesign(b?.id ?? '')).toBe(true);
    expect(listDesigns().map((d) => d.name)).toEqual(['Mine']);
    // A design that is gone cannot be changed.
    expect(updateDesign(b?.id ?? '', { name: 'C' })).toBeUndefined();
  });

  it('reads a corrupt store as empty, and drops broken entries', () => {
    window.localStorage.setItem('tastir.designs', '{not json');
    expect(listDesigns()).toEqual([]);
    window.localStorage.setItem('tastir.designs', '{"a": 1}');
    expect(listDesigns()).toEqual([]);
    const good = addDesign(fields);
    const raw = JSON.parse(
      window.localStorage.getItem('tastir.designs') ?? '',
    ) as unknown[];
    window.localStorage.setItem(
      'tastir.designs',
      JSON.stringify([...raw, { id: 'x', name: 3 }, null]),
    );
    expect(listDesigns()).toEqual([good]);
  });

  it('never throws when storage is blocked', () => {
    const get = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(listDesigns()).toEqual([]);
    expect(addDesign(fields)).toBeUndefined();
    expect(deleteDesign('x')).toBe(false);
    get.mockRestore();
    set.mockRestore();
  });
});

it('preserves custom Jali finishes and rejects damaged finish settings without dropping old designs', () => {
  const legacy = addDesign(fields);
  const jali = {
    material: 'wood' as const,
    finish: 'custom' as const,
    framework: '#864b31',
    background: '#234a79',
  };
  const saved = addDesign({ ...fields, look: 'jali', jali });
  expect(getDesign(saved!.id)?.jali).toEqual(jali);
  updateDesign(saved!.id, {
    jali: { ...jali, material: 'metal', finish: 'silver' },
  });
  expect(getDesign(saved!.id)?.jali?.material).toBe('metal');
  const raw = JSON.parse(
    window.localStorage.getItem('tastir.designs')!,
  ) as unknown[];
  window.localStorage.setItem(
    'tastir.designs',
    JSON.stringify([
      ...raw,
      { ...saved, id: 'broken', jali: { ...jali, framework: 'url(#bad)' } },
    ]),
  );
  expect(listDesigns()).toHaveLength(2);
  expect(getDesign(legacy!.id)).toEqual(legacy);
});

it.each(['gold', 'silver', 'wood', 'stone'])(
  'migrates stored legacy %s without altering its colors',
  (material) => {
    const saved = addDesign(fields)!;
    const legacy = { material, framework: '#864b31', background: '#234a79' };
    window.localStorage.setItem(
      'tastir.designs',
      JSON.stringify([{ ...saved, look: 'jali', jali: legacy }]),
    );
    const migrated = getDesign(saved.id)!.jali!;
    expect(migrated.framework).toBe(legacy.framework);
    expect(migrated.background).toBe(legacy.background);
    expect(migrated.material).toBe(
      ['gold', 'silver'].includes(material) ? 'metal' : material,
    );
    expect(migrated.finish).toBe(
      material === 'stone'
        ? 'limestone'
        : material === 'wood'
          ? 'oak'
          : material,
    );
  },
);
