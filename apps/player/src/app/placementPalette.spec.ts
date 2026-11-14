import fixtures from './libraryFixtures';
import { atPlace, parseTutorial } from '@tastir/schema';
import attarineJson from '@tutorials/attarine-star-rosettes.json';
import { extraColors, ORIGINAL, PALETTES, SLOTS } from './coloring';
import { loadModel } from './model';
import { placeFills } from './placement';

const benYoussefJson = atPlace(
  parseTutorial(attarineJson),
  'ben-youssef-star-rosettes',
);
const SLOT_NAMES: readonly string[] = [...SLOTS, 'e', 'f', 'g'];

/** Every fill of one tile under a palette. */
function fillsUnder(json: unknown, palette: string): Set<string> {
  const model = loadModel(json);
  const fill = placeFills(model, { palette, chosen: {} });
  return new Set(model.pattern.pieces.map((_, p) => fill(p, 0, 0)));
}

describe('placement colours follow the palette', () => {
  it('names a palette slot in every rule, never a fixed colour', () => {
    // A fixed colour would stay put when the learner picks another palette;
    // the photo's colours belong in pattern.original instead.
    for (const [file, json] of Object.entries(fixtures)) {
      type Colouring = { placements?: { rules: { color: string }[] } };
      const t = json as {
        pattern: Colouring;
        places?: { pattern?: Colouring }[];
      };
      const rules = [
        t.pattern,
        ...(t.places ?? []).map((p) => p.pattern),
      ].flatMap((p) => p?.placements?.rules ?? []);
      for (const r of rules)
        expect(SLOT_NAMES, `${file}: ${r.color}`).toContain(r.color);
    }
  });

  it('recolours Ben Youssef when another palette is picked', () => {
    const original = fillsUnder(benYoussefJson, ORIGINAL);
    const alhambra = fillsUnder(benYoussefJson, 'Alhambra');
    expect([...original].sort()).toEqual(
      ['#000000', '#385c33', '#404284', '#5e0d12', '#ffffff'].sort(),
    );
    expect(alhambra).toEqual(new Set(Object.values(PALETTES['Alhambra'] ?? {})));
  });

  it('gives the extra slots a colour of their own in every preset', () => {
    for (const name of Object.keys(PALETTES)) {
      const extra = extraColors(undefined, name);
      for (const c of Object.values(extra))
        expect(c, name).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
