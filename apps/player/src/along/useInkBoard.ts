import {
  cellOf,
  type Pattern,
  type Vec,
  classicSelection,
  computePattern,
  inkPieces,
  type Cell,
  type InkPiece,
  type PieceType,
  type Scene,
} from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { useMemo, useState } from 'react';
import { asPanel, type Model } from '../app/model';
import { check, pointPlaces, type Draft } from '../editor/document';
import { imagesOf, runOf, tutorialOf, type Inkable } from '../editor/finish';
import { addPattern, freeTitle, type UserPattern } from '../editor/patterns';
import { strokesOf } from '@tastir/engine';
import type { InkAlong } from '@tastir/schema';
import { withoutDuplicates } from './dedupe';
import { withTutorialInk } from './drawForMe';
import { readyToInk, samePieces } from './inking';

/** The board ready to ink: its tile, scene and every bit of line. */
interface Ready {
  readonly draft: Draft;
  readonly scene: Scene;
  readonly cell: Cell;
  readonly pieces: readonly InkPiece[];
  /** For runs along one line: each bit's line, as a key. */
  readonly inkable: Inkable;
  /** The bits the tutorial's ink keeps. */
  readonly classic: ReadonlySet<string>;
  /** The pattern they make, with its pieces. */
  readonly pattern: Pattern;
  /** Whether the pattern is its own mirror image. */
  readonly mirror: boolean;
}

const r6 = (n: number) => (Math.abs(n) < 5e-7 ? 0 : n).toFixed(6);

/** The line a bit runs along, as a key shared by every bit on it. */
function lineKey(p: InkPiece): string {
  const { a, b } = p.segment;
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  if (dx < -1e-9 || (Math.abs(dx) <= 1e-9 && dy < 0)) {
    dx = -dx;
    dy = -dy;
  }
  return `${r6(dx)},${r6(dy)},${r6(a.x * dy - a.y * dx)}`;
}

/** How the learner's inking stands against the pattern. */
export interface InkCheck {
  /** The kinds of piece the ink closes. */
  readonly types: readonly PieceType[];
  /** Whether they are the pattern's. */
  readonly matches: boolean;
}

/**
 * The ink stage of drawing along: the learner inks their own board, bit
 * by bit (with its turned and mirrored copies, a whole run at a time, as
 * in the editor), and the pieces their ink closes are checked against the
 * pattern's. When they match, the drawing is kept as one of their own
 * patterns and played from the repeat.
 */
export function useInkBoard(
  model: Model,
  draft: Draft,
  active: boolean,
  chosen: ReadonlySet<string>,
  setChosen: (s: ReadonlySet<string>) => void,
) {
  const { tutorial } = model;
  const ready = useMemo((): Ready | { reason: string } | undefined => {
    if (!active) return undefined;
    try {
      const d = readyToInk(tutorial, model.scene, draft);
      const scene = check(d).scene;
      const cell = cellOf(scene, d.pattern?.cell ?? '');
      const pieces = inkPieces(scene, cell);
      const paths = new Map(
        pieces.map((p) => [p.id, { along: lineKey(p) } as InkAlong]),
      );
      const inkable = { cell, pieces, paths };
      // The bits the tutorial's own ink keeps, and the pieces they close.
      const classic = classicSelection(
        pieces,
        asPanel(model).pattern.ink,
        1e-7,
        cell,
      );
      const pattern = computePattern(
        scene,
        d as Tutorial,
        strokesOf(pieces, classic),
      );
      // Symmetric inking follows the pattern's own symmetry: its turns,
      // and its mirror images only when it has them (a pinwheel has not).
      const mirror =
        !tutorial.chiral &&
        [...classic].every((id) =>
          imagesOf(inkable, id, 1, true).every((i) => classic.has(i)),
        );
      return {
        draft: d,
        scene,
        cell,
        pieces,
        inkable,
        classic,
        pattern,
        mirror,
      };
    } catch (e) {
      return { reason: e instanceof Error ? e.message : String(e) };
    }
  }, [active, tutorial, model.scene, draft]);
  const [symmetric, setSymmetric] = useState(true);
  const [wholeRuns, setWholeRuns] = useState(true);

  const result = useMemo((): InkCheck | undefined => {
    if (!ready || 'reason' in ready || !chosen.size) return undefined;
    try {
      const pattern = computePattern(
        ready.scene,
        ready.draft as Tutorial,
        strokesOf(ready.pieces, chosen),
      );
      const made = {
        expect: {
          pieceTypes: pattern.types.length,
          pieces: pattern.types.map((t) => ({
            name: t.name ?? '',
            vertices: t.vertices,
            area: Number(t.area.toFixed(5)),
            perCell: t.perCell,
          })),
        },
      } as Pick<Tutorial, 'expect'>;
      return { types: pattern.types, matches: samePieces(made, tutorial) };
    } catch {
      return { types: [], matches: false };
    }
  }, [ready, chosen, tutorial]);

  // Hints at the ink: what is still missing, one piece kind at a time.
  const [hintLevel, setHintLevel] = useState(0);
  const hint = useMemo(() => {
    if (!ready || 'reason' in ready || !hintLevel) return undefined;
    const missing = [...ready.classic].filter((id) => !chosen.has(id));
    const extra = [...chosen].filter((id) => !ready.classic.has(id));
    // The first kind of piece the learner's ink does not close yet.
    const have = new Set(
      (result?.types ?? []).map((t) => `${t.vertices},${t.area.toFixed(4)}`),
    );
    const kind = ready.pattern.types.findIndex(
      (t) => !have.has(`${t.vertices},${t.area.toFixed(4)}`),
    );
    const around = (id: string) => {
      const piece = ready.pieces.find((q) => q.id === id);
      if (!piece || kind < 0) return false;
      const { u, v } = ready.cell;
      return ready.pattern.pieces
        .filter((q) => q.type === kind)
        .some((q) =>
          [-1, 0, 1].some((i) =>
            [-1, 0, 1].some((j) => {
              const d = { x: u.x * i + v.x * j, y: u.y * i + v.y * j };
              const poly = q.polygon.map((c) => ({
                x: c.x + d.x,
                y: c.y + d.y,
              }));
              return (
                onOutline(piece.segment.a, poly) &&
                onOutline(piece.segment.b, poly)
              );
            }),
          ),
        );
    };
    const forKind = missing.filter(around);
    // Once nothing is missing, the hints mark the extra bits to erase.
    const erasing = !missing.length && extra.length > 0;
    const focus = erasing ? extra : forKind.length ? forKind : missing;
    const first = ready.pieces.find((q) => q.id === focus[0]);
    const kindName = kind >= 0 ? ready.pattern.types[kind]?.name : undefined;
    return {
      glow: new Set(focus),
      /** The bit that is ringed, which a click near the ring takes. */
      ringId: hintLevel >= 2 || erasing ? first?.id : undefined,
      ring:
        (hintLevel >= 2 || erasing) && first
          ? [
              {
                x: (first.segment.a.x + first.segment.b.x) / 2,
                y: (first.segment.a.y + first.segment.b.y) / 2,
              },
            ]
          : [],
      dashed: new Set(hintLevel >= 3 && !erasing ? missing : []),
      words: !missing.length
        ? extra.length
          ? `Everything the pattern keeps is inked, and ${extra.length} ${extra.length === 1 ? 'bit is' : 'bits are'} extra: ${extra.length === 1 ? 'it glows' : 'they glow'}. Click the ringed one to erase it.`
          : 'Everything the pattern keeps is inked.'
        : hintLevel === 1
          ? `The bits that glow are still to ink${kindName ? `, round the ${kindName}` : ''}.`
          : hintLevel === 2
            ? `Click the ringed bit${kindName ? ` of the ${kindName}` : ''}.`
            : `All ${missing.length} bits still to ink are dashed.`,
    };
  }, [ready, hintLevel, chosen, result]);

  const toggle = (id: string) => {
    if (!ready || 'reason' in ready) return;
    const { inkable } = ready;
    // A whole run on a bit the pattern keeps is the pattern's own stretch
    // of that line, so following the hints never inks more than it keeps.
    const run = !wholeRuns
      ? [id]
      : ready.classic.has(id) && !chosen.has(id)
        ? keptRun(ready, id)
        : runOf(
            inkable,
            id,
            pointPlaces(ready.scene).map((p) => p.at),
            ready.scene,
          );
    const ids = symmetric
      ? run.flatMap((r) => imagesOf(inkable, r, tutorial.fold, ready.mirror))
      : run;
    const next = new Set(chosen);
    const on = !chosen.has(id);
    for (const i of ids) {
      if (on) next.add(i);
      else next.delete(i);
    }
    setChosen(next);
    setHintLevel(0);
  };

  /** “Ink it for me”: the bits the tutorial's own ink runs along. */
  const inkForMe = () => {
    if (!ready || 'reason' in ready) return;
    setChosen(
      classicSelection(
        ready.pieces,
        asPanel(model).pattern.ink,
        1e-7,
        ready.cell,
      ),
    );
  };

  /**
   * Keeps the drawing as one of the learner's patterns, based on the
   * tutorial and crediting it, with the tutorial's own ink taken onto
   * the board (the learner's ink closes the same pieces). Its address,
   * or why it could not be kept.
   */
  const keep = (): { pattern: UserPattern } | { reason: string } => {
    if (!ready || 'reason' in ready) return { reason: 'There is no tile.' };
    try {
      // Each figure once, however many times the learner drew it.
      const once = withoutDuplicates(draft);
      const clean = [...check(once).status.values()].every((st) => st.ok);
      const board = readyToInk(tutorial, model.scene, clean ? once : draft);
      const inked = withTutorialInk(tutorial, model.scene, board);
      const made = tutorialOf(inked);
      if (!('tutorial' in made)) return { reason: made.reason };
      if (!samePieces(made.tutorial, tutorial))
        return { reason: 'The drawing does not close the pattern’s pieces.' };
      const pattern = addPattern(
        {
          ...made.tutorial,
          id: `${tutorial.id}-mine`,
          title: freeTitle(`My ${tutorial.title}`),
          credits: [
            ...tutorial.credits,
            {
              source: `Tastir: ${tutorial.title}`,
              note: `Drawn along with the library tutorial “${tutorial.title}” (${tutorial.id}).`,
            },
          ],
        },
        {
          tutorial: tutorial.id,
          title: tutorial.title,
          step: tutorial.steps.filter((s) => !s.hidden).length,
        },
      );
      return pattern
        ? { pattern }
        : {
            reason:
              'This browser would not keep it: its storage is blocked or full.',
          };
    } catch (e) {
      return { reason: e instanceof Error ? e.message : String(e) };
    }
  };

  return {
    ready,
    result,
    hint,
    hintLevel,
    setHintLevel,
    /** The kinds of piece the ink does not close yet, by name. */
    missingKinds: (() => {
      if (!ready || 'reason' in ready || !result) return [];
      const have = new Set(
        result.types.map((t) => `${t.vertices},${t.area.toFixed(4)}`),
      );
      return ready.pattern.types
        .filter((t) => !have.has(`${t.vertices},${t.area.toFixed(4)}`))
        .map((t) => t.name ?? `${t.vertices}-cornered piece`);
    })(),
    mirror: ready && !('reason' in ready) ? ready.mirror : true,
    toggle,
    inkForMe,
    keep,
    symmetric,
    setSymmetric,
    wholeRuns,
    setWholeRuns,
  };
}

/** Whether a point lies on a polygon's outline. */
function onOutline(p: Vec, poly: readonly Vec[]): boolean {
  return poly.some((a, i) => {
    const b = poly[(i + 1) % poly.length] as Vec;
    const d = { x: b.x - a.x, y: b.y - a.y };
    const len2 = d.x * d.x + d.y * d.y;
    const t = ((p.x - a.x) * d.x + (p.y - a.y) * d.y) / len2;
    if (t < -1e-6 || t > 1 + 1e-6) return false;
    return Math.hypot(p.x - (a.x + d.x * t), p.y - (a.y + d.y * t)) < 1e-6;
  });
}

/** The stretch of line through a bit that the pattern keeps: the kept
 * bits along the same line, joined end to end with it. */
function keptRun(ready: Ready, id: string): string[] {
  const line = ready.inkable.paths.get(id)?.along;
  const same = ready.pieces.filter(
    (p) =>
      ready.classic.has(p.id) && ready.inkable.paths.get(p.id)?.along === line,
  );
  const at = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6;
  const run = new Set([id]);
  const todo = same.filter((p) => p.id === id);
  while (todo.length) {
    const p = todo.pop() as InkPiece;
    for (const q of same)
      if (
        !run.has(q.id) &&
        [q.segment.a, q.segment.b].some(
          (e) => at(e, p.segment.a) || at(e, p.segment.b),
        )
      ) {
        run.add(q.id);
        todo.push(q);
      }
  }
  return [...run];
}
