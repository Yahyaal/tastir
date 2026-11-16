import './review.css';
import './plan.css';
import './duplicates.css';
import { LIBRARY } from '../app/library';
import { InkOverlay } from './InkOverlay';
// Raw text, so TypeScript does not infer a type for the large file.
import raw from './duplicates.json?raw';

/**
 * Which tutorials draw the same design (#/plan/duplicates, dev server
 * only). The data comes from tools/duplicates.mts, which cuts every
 * tutorial into its pieces with the engine and compares them; rerun it
 * after tutorials change.
 */

type Pt = [number, number];
interface Shape {
  key: string;
  cover: number;
  size: number;
  perCell: number;
  outline: Pt[];
}
interface Member {
  id: string;
  title: string;
  region?: string;
  /** Its family on this branch, and on main (what production shows). */
  family?: string;
  mainFamily?: string;
  shapes: Shape[];
  patch: { s: number; p: Pt[] }[];
}
interface Pair {
  a: string;
  b: string;
  proportions: boolean;
  neighbours: boolean;
}
interface Group {
  level: 'same' | 'arranged' | 'proportions';
  pairs: Pair[];
  members: Member[];
}
const DATA = JSON.parse(raw) as {
  made: string;
  count: number;
  familyTitles: Record<string, string>;
  groups: Group[];
};

const thumb = (id: string) => {
  const p = LIBRARY.find((e) => e.id === id)?.preview;
  return p ? import.meta.env.BASE_URL + p.thumbnail : undefined;
};

const points = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(' ');

/** Plain names for the shapes, from their corners. */
function shapeName(s: Shape): string {
  const n = s.outline.length;
  const reflex = (s.key.split('|')[1] ?? '')
    .split(' ')
    .filter((c) => Number(c.split('/')[0]) > 180).length;
  if (reflex >= 4 && reflex * 2 === n) return `${n / 2}-pointed star`;
  if (reflex > 0) return `${n}-sided piece, ${reflex} corners pointing in`;
  const names: Record<number, string> = {
    3: 'triangle',
    4: 'four-sided piece',
    5: 'pentagon',
    6: 'hexagon',
    8: 'octagon',
    10: 'decagon',
    12: 'dodecagon',
  };
  return names[n] ?? `${n}-sided piece`;
}

/** The colour of each shape across a group: the same shape, the same colour. */
function colours(g: Group): Map<string, number> {
  const m = new Map<string, number>();
  for (const mem of g.members)
    for (const s of mem.shapes) if (!m.has(s.key)) m.set(s.key, m.size);
  return m;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Pieces({ m, colour }: { m: Member; colour: Map<string, number> }) {
  return (
    <svg className="dup-patch" viewBox="-2.4 -2.4 4.8 4.8" aria-hidden="true">
      {m.patch.map((q, i) => (
        <polygon
          key={i}
          points={points(q.p)}
          className={`dup-s${(colour.get(m.shapes[q.s]?.key ?? '') ?? 0) % 10}`}
        />
      ))}
    </svg>
  );
}

function Outline({ s, c }: { s: Shape; c: number }) {
  return (
    <svg
      className="dup-outline"
      viewBox="-0.75 -0.75 1.5 1.5"
      aria-hidden="true"
    >
      <polygon points={points(s.outline)} className={`dup-s${c % 10}`} />
    </svg>
  );
}

const VERDICT: Record<Group['level'], { title: string; text: string }> = {
  same: {
    title: 'Candidate match',
    text: 'The rounded piece measurements and sampled neighbourhood counts agree. Use the ink overlay to check whether the complete lines agree.',
  },
  arranged: {
    title: 'Same proportions, different neighbourhoods',
    text: 'The rounded shape signatures and wall shares agree, but the local neighbour sequences or their frequencies differ. Use the ink overlay to examine the lines.',
  },
  proportions: {
    title: 'Shared shapes, different proportions',
    text: 'The shape signatures agree, but their measured shares of the wall differ. Compare the ink before deciding how the designs are related.',
  },
};

/** The library cards a group's members show as: one per family, one per
 * tutorial in none. */
function cards(g: Group, which: 'family' | 'mainFamily'): string[] {
  const seen = new Map<string, string>();
  for (const m of g.members) {
    const f = m[which];
    const key = f ?? `alone:${m.id}`;
    if (!seen.has(key))
      seen.set(key, f ? `“${DATA.familyTitles[f] ?? f}”` : m.title);
  }
  return [...seen.values()];
}

/** Whether this branch changed how the group's members are carded. */
const changed = (g: Group) => g.members.some((m) => m.family !== m.mainFamily);

function CardNote({ g }: { g: Group }) {
  const before = cards(g, 'mainFamily');
  const after = cards(g, 'family');
  const say = (c: string[]) =>
    c.length === 1 ? `1 card, ${c[0]}` : `${c.length} cards: ${c.join('; ')}`;
  if (!changed(g))
    return (
      <p className="dup-family">
        In production and on this branch: {say(before)}. Nothing changes.
      </p>
    );
  return (
    <p className="dup-family dup-changed">
      <b>Changed on this branch.</b> In production: {say(before)}. On this
      branch: {say(after)}.
    </p>
  );
}

const PRODUCTION = 'https://tastir-studio.vercel.app/';

function GroupView({ g, n }: { g: Group; n: number }) {
  const colour = colours(g);
  const first = g.members[0];
  const allKeys = [...colour.keys()];
  const v = VERDICT[g.level];
  return (
    <section className={`dup-group dup-${g.level}`} id={`group-${n}`}>
      <h3>
        <span className="dup-badge">{v.title}</span> {n}.{' '}
        {g.members.map((m) => m.title).join(' · ')}
      </h3>
      <p>{v.text}</p>
      <CardNote g={g} />
      <div className="dup-row">
        {g.members.map((m, i) => (
          <figure key={m.id} className="dup-member">
            <figcaption>
              <b>{String.fromCharCode(65 + i)}</b>{' '}
              <a href={`#/${m.id}`}>{m.title}</a>
              <span className="dup-id">
                {m.id}
                {m.region ? ` · ${m.region}` : ''}
              </span>
              <span className="dup-links">
                <a
                  href={`${PRODUCTION}#/${m.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Production ↗
                </a>
                <a href={`#/${m.id}`} target="_blank" rel="noreferrer">
                  This branch ↗
                </a>
              </span>
            </figcaption>
            {thumb(m.id) ? (
              <img src={thumb(m.id)} alt="" className="dup-thumb" />
            ) : null}
            <Pieces m={m} colour={colour} />
          </figure>
        ))}
      </div>
      <p className="dup-hint">
        Top: the pattern as the library shows it. Bottom: the same pattern
        redrawn at the same scale with one colour for each piece shape, so
        colour, zoom and wall style no longer hide what is the same. A drawing
        may be shifted or turned against its neighbour, because each tutorial
        starts from its own centre O.
      </p>
      <table className="dup-table">
        <thead>
          <tr>
            <th>Piece</th>
            {g.members.map((m, i) => (
              <th key={m.id}>
                {String.fromCharCode(65 + i)}: share of the wall
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allKeys.map((k) => {
            const c = colour.get(k) ?? 0;
            const ref = first?.shapes.find((s) => s.key === k);
            const any = g.members
              .map((m) => m.shapes.find((s) => s.key === k))
              .find((s) => s !== undefined);
            if (!any) return null;
            return (
              <tr key={k}>
                <td className="dup-piece">
                  <Outline s={any} c={c} /> {shapeName(any)}
                </td>
                {g.members.map((m) => {
                  const s = m.shapes.find((x) => x.key === k);
                  const differs =
                    !s || !ref || Math.abs(s.cover - ref.cover) > 0.005;
                  return (
                    <td key={m.id} className={differs ? 'dup-differs' : ''}>
                      {s ? pct(s.cover) : 'none'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {g.level !== 'same' && (
        <table className="dup-table dup-pairs">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Same piece shapes</th>
              <th>Same proportions</th>
              <th>Same neighbours</th>
            </tr>
          </thead>
          <tbody>
            {g.pairs.map((p) => {
              const a = g.members.findIndex((m) => m.id === p.a);
              const b = g.members.findIndex((m) => m.id === p.b);
              const yes = (ok: boolean) => (
                <td className={ok ? 'dup-yes' : 'dup-no'}>
                  {ok ? 'yes' : 'no'}
                </td>
              );
              return (
                <tr key={p.a + p.b}>
                  <td>
                    {String.fromCharCode(65 + a)} and{' '}
                    {String.fromCharCode(65 + b)}
                  </td>
                  {yes(true)}
                  {yes(p.proportions)}
                  {yes(p.neighbours)}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function DuplicatesPlan() {
  const same = DATA.groups.filter((g) => g.level === 'same');
  const related = DATA.groups.filter((g) => g.level !== 'same');
  const sameCount = same.reduce((a, g) => a + g.members.length, 0);
  return (
    <div className="review plan dup-page">
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/review">Review page</a>
        </span>
      </nav>
      <header className="review-head">
        <h1>Which patterns are the same design?</h1>
        <p className="lede">
          I compared all {DATA.count} tutorials by the pieces the engine cuts
          them into, not by their names or colours. {same.length} groups,{' '}
          {sameCount} tutorials in all, are candidate matches. The ink overlay
          below checks their lines. {related.length} more groups share their
          piece shapes but differ in the existing measurements.
        </p>
      </header>

      <p>
        <a href="#/notes/ink-presentation">
          See the visual research presentation →
        </a>
      </p>
      <InkOverlay />

      <p>
        The ten earlier place merges were checked against their archived
        tutorial ink.{' '}
        <a href="#/notes/duplicates-review">
          Read the merge audit and open each overlay.
        </a>
      </p>

      <h2 className="group">How the comparison works</h2>
      <p>
        Every finished pattern is a wall of pieces: stars, crosses, kites and so
        on. Two tutorials draw the same design when their walls are made of the
        same pieces put together the same way. Colours, zoom, which way the
        pattern is turned, and the wall style (tiles, lines, interlace) do not
        count, because the learner draws the same lines. Each pair of tutorials
        goes through three checks, each stricter than the last.
      </p>
      <ol>
        <li>
          <b>Same piece shapes.</b> Each piece is described by its corner angles
          and the lengths of its sides compared with its shortest side, so size
          and turn do not matter. Both tutorials must have exactly the same set
          of shapes.
        </li>
        <li>
          <b>Same proportions.</b> Each shape must cover the same share of the
          wall in both, for example stars 58.6% and crosses 41.4%.
        </li>
        <li>
          <b>Same neighbours.</b> Going round every piece, the shapes across its
          sides must come in the same order, and going round every corner, the
          shapes meeting there must come in the same order. This is what tells
          apart local arrangements of the same pieces. These sequences must also
          occur equally often per normalized wall area.
        </li>
      </ol>
      <p>
        These checks find candidates; they do not prove identical walls. The
        neighbourhood comparison counts local sequences per normalized wall
        area, so choosing a larger tile does not multiply the signature. Use the
        overlay above to compare the actual ink. The candidate tool is{' '}
        <code>tools/duplicates.mts</code>, and its results were made on{' '}
        {DATA.made}.
      </p>
      <p className="dup-note">
        <b>A correction.</b> The first list I gave you today was wrong in
        places. A bug in that first script lost the corner angles, so it only
        compared how many corners each piece had and how much of the wall it
        covered. That wrongly put <i>Sırçalı stars</i> (sharp stars with 45°
        points) with the star and cross (90° points), and <i>Charbagh stars</i>{' '}
        with <i>Iranian star columns</i>, which use the same pieces laid out
        differently. This page uses the corrected script and the neighbours
        check.
      </p>

      <h2 className="group">Candidate matches ({same.length} groups)</h2>
      {same.map((g, i) => (
        <GroupView key={i} g={g} n={i + 1} />
      ))}

      <h2 className="group">Shared piece shapes ({related.length} groups)</h2>
      <p>
        These groups share rounded shape signatures, but other candidate
        measurements differ. Highlighted cells show the differences; the ink
        overlay compares the actual lines.
      </p>
      {related.map((g, i) => (
        <GroupView key={i} g={g} n={same.length + i + 1} />
      ))}
    </div>
  );
}
