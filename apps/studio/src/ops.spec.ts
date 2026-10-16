import { Resvg } from '@resvg/resvg-js';
import { firstFailingStep } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { construct, ink, inspect, paint, problems, setTile } from './ops.js';
import { applyEdit, historyOf, newProject, OWNER, travel } from './project.js';
import { emptyDraft, loadModel } from './player.js';
import { constructionSvg, png, RENDER_FONT, wallSvg } from './picture.js';

/** The square A–N–W–S on the unit circle, built from O and A only. */
const SQUARE = [
  { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
  { kind: 'line', name: 'L0', from: 'O', to: 'A' },
  { kind: 'intersection', name: 'W', first: 'L0', second: 'C0', angle: 180 },
  { kind: 'circle', name: 'C1', centre: 'A', through: 'W' },
  { kind: 'circle', name: 'C2', centre: 'W', through: 'A' },
  { kind: 'intersection', name: 'T', first: 'C1', second: 'C2', angle: 90 },
  { kind: 'intersection', name: 'B', first: 'C1', second: 'C2', angle: 270 },
  { kind: 'line', name: 'Axis', from: 'T', to: 'B' },
  { kind: 'intersection', name: 'N', first: 'Axis', second: 'C0', angle: 90 },
  { kind: 'intersection', name: 'S', first: 'Axis', second: 'C0', angle: 270 },
];
const SIDES = [
  { from: 'A', to: 'N' },
  { from: 'N', to: 'W' },
  { from: 'W', to: 'S' },
  { from: 'S', to: 'A' },
];

const blank = () => emptyDraft('studio-square', 'Studio square');

describe('studio drawing edits', () => {
  it('builds, inks, tiles and colors a playable square from O and A', () => {
    let draft = construct(blank(), SQUARE);
    const n = inspect(draft).points.find((p) => p.name === 'N');
    expect(n).toEqual({ name: 'N', x: 0, y: 1 });
    draft = ink(draft, SIDES);
    expect(inspect(draft).ink.map((i) => i.id)).toEqual([
      'ink1',
      'ink2',
      'ink3',
      'ink4',
    ]);
    draft = setTile(draft, ['A', 'N', 'W', 'S']);
    const pieces = inspect(draft).tile!.pieces;
    expect(pieces).toHaveLength(1);
    draft = paint(draft, 'Fès tile', [
      { piece: pieces[0]!.id, color: '#2453A6' },
    ]);
    expect(inspect(draft).tile!.pieces[0]!.color).toBe('#2453a6');
    expect(problems(draft, { fold: 4, tile: 'parallelogram' })).toEqual([]);
    const tutorial = parseTutorial(draft);
    expect(firstFailingStep(tutorial)).toBeUndefined();
    expect(loadModel(tutorial).pattern.types).toHaveLength(1);
  });

  it('refuses a whole batch when one element cannot be drawn', () => {
    const draft = construct(blank(), SQUARE.slice(0, 2));
    expect(() =>
      construct(draft, [
        { kind: 'circle', name: 'C9', centre: 'O', through: 'A' },
        {
          kind: 'intersection',
          name: 'X',
          first: 'L0',
          second: 'C0',
          angle: null,
        },
      ]),
    ).toThrow(/Step 4/);
    expect(draft.steps).toHaveLength(2);
    expect(() =>
      construct(draft, [
        { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
      ]),
    ).toThrow(/already used/);
  });

  it('will not remove an element later steps are built on', () => {
    const draft = construct(blank(), SQUARE);
    expect(() => construct(draft, [], ['C1'])).toThrow(/built on/);
    expect(construct(draft, [], ['S']).steps).toHaveLength(SQUARE.length - 1);
  });

  it('will not tile ink that leaves gaps or loose ends', () => {
    // Two adjacent sides already close: their copies are the other two.
    const draft = construct(blank(), SQUARE);
    expect(() =>
      setTile(ink(draft, SIDES.slice(0, 2)), ['A', 'N', 'W', 'S']),
    ).not.toThrow();
    expect(() =>
      setTile(ink(draft, SIDES.slice(0, 1)), ['A', 'N', 'W', 'S']),
    ).toThrow(/loose end|cover|no pieces/);
    const inside = ink(draft, [{ from: 'O', to: 'A' }, ...SIDES]);
    expect(() => setTile(inside, ['A', 'N', 'W', 'S'])).toThrow(/loose end/);
  });

  it('lists the problems against a brief', () => {
    const draft = construct(blank(), SQUARE);
    expect(problems(draft, { maxSteps: 3 })).toEqual([
      'The draft has 10 steps; the goal is at most 3.',
      'Nothing is inked yet.',
      'There is no repeating tile yet.',
    ]);
  });
});

describe('studio history', () => {
  const at = '2026-10-16T00:00:00.000Z';
  const start = () => newProject('p', blank(), OWNER, {}, at);

  it('refuses an edit based on an old revision', () => {
    const p = applyEdit(
      start(),
      1,
      'claude-code',
      'circle',
      (d) => construct(d, SQUARE.slice(0, 1)),
      at,
    );
    expect(p.revision).toBe(2);
    expect(() =>
      applyEdit(
        p,
        1,
        'codex',
        'line',
        (d) => construct(d, SQUARE.slice(1, 2)),
        at,
      ),
    ).toThrow(/revision 1; it is now at revision 2/);
  });

  it("undoes an agent's own changes but stops at the owner's", () => {
    let p = applyEdit(
      start(),
      1,
      'claude-code',
      'circle',
      (d) => construct(d, SQUARE.slice(0, 1)),
      at,
    );
    p = applyEdit(
      p,
      2,
      OWNER,
      'line',
      (d) => construct(d, SQUARE.slice(1, 2)),
      at,
    );
    p = applyEdit(
      p,
      3,
      'claude-code',
      'W',
      (d) => construct(d, SQUARE.slice(2, 3)),
      at,
    );
    expect(historyOf(p).undo.map((e) => e.author)).toEqual([
      'claude-code',
      OWNER,
      'claude-code',
    ]);
    expect(() => travel(p, 4, 'claude-code', 'undo', 2, true, at)).toThrow(
      /made by owner/,
    );
    const undone = travel(p, 4, 'claude-code', 'undo', 1, true, at);
    expect(undone.current.draft.steps).toHaveLength(2);
    expect(undone.revision).toBe(5);
    const redone = travel(undone, 5, OWNER, 'redo', 1, false, at);
    expect(redone.current.draft.steps).toHaveLength(3);
    expect(() => travel(redone, 6, OWNER, 'redo', 1, false, at)).toThrow(
      /Only 0 redo/,
    );
  });
});

describe('studio pictures', () => {
  /** How many pixels of a picture are within a few levels of a color. */
  const count = (svgText: string, hex: string) => {
    // Each read of pixels copies the whole image, so read it once.
    const pixels = new Resvg(svgText, {
      fitTo: { mode: 'width', value: 400 },
      font: RENDER_FONT,
    }).render().pixels;
    const want = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    let n = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (want.every((v, k) => Math.abs(pixels[i + k]! - v) <= 6)) n++;
    return n;
  };
  const square = () =>
    paint(
      setTile(ink(construct(blank(), SQUARE), SIDES), ['A', 'N', 'W', 'S']),
      null,
      [{ piece: 'square', color: '#2453a6' }],
    );

  it('draws the construction with its ink and names', () => {
    const text = constructionSvg(ink(construct(blank(), SQUARE), SIDES));
    expect(text).toContain('>N</text>');
    expect(count(text, '#1c2733')).toBeGreaterThan(200);
    expect(png(text, 800).subarray(1, 4).toString()).toBe('PNG');
  });

  it('draws the wall in the colors chosen', () => {
    const draft = square();
    expect(inspect(draft).tile!.pieces[0]!.id).toBe('square');
    const text = wallSvg(draft);
    expect(count(text, '#2453a6')).toBeGreaterThan(10_000);
    expect(() => wallSvg(construct(blank(), SQUARE))).toThrow(/no wall yet/);
  });

  it('shows a part of the drawing when asked', () => {
    const text = constructionSvg(construct(blank(), SQUARE), {
      x: -0.5,
      y: 0.5,
      width: 1,
      height: 1,
    });
    expect(text).toContain('viewBox="-0.5 -1.5 1 1"');
    expect(text).toContain('>N</text>');
    expect(text).not.toContain('>S</text>');
  });
});
