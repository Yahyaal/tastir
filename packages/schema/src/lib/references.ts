import type { ElementSpec, Tutorial } from './tutorial.js';

/** The kind of element a name refers to. A `repeat` names a group. */
export type ElementKind =
  'point' | 'points' | 'line' | 'circle' | 'polygon' | 'repeat';

export interface Issue {
  readonly path: string;
  readonly message: string;
}

/**
 * How many copies a repeat makes, named `name@1` to `name@n`: one fewer
 * than the order of a rotation, and one for a mirror.
 */
export const copyCount = (by: string): number =>
  by.startsWith('rot') ? Number(by.slice('rot'.length)) - 1 : 1;

const article = (kind: string) => (/^[aeiou]/.test(kind) ? 'an' : 'a');
const oneOf = (kinds: readonly ElementKind[]) =>
  kinds.length === 1
    ? `${article(kinds[0] as string)} ${kinds[0]}`
    : kinds.slice(0, -1).join(', ') + ' or ' + kinds.at(-1);

const CURVES: ElementKind[] = ['line', 'circle', 'polygon'];

/**
 * Checks that every reference in the tutorial names an element made
 * earlier (rule 2), of a kind that makes sense where it is used, and that
 * pattern and expect agree with the construction. Returns every problem.
 */
export function checkReferences(t: Tutorial): Issue[] {
  const issues: Issue[] = [];
  const known = new Map<string, ElementKind>([
    ['O', 'point'],
    ['A', 'point'],
  ]);
  const definedIn = new Map<string, number>();
  for (const step of t.steps) {
    for (const name of Object.keys(step.create)) {
      if (!definedIn.has(name)) definedIn.set(name, step.id);
    }
  }

  const resolve = (ref: string): ElementKind | undefined => {
    const direct = known.get(ref);
    if (direct) return direct;
    const crossing = /^(.+)\.\d+$/.exec(ref);
    if (crossing && known.get(crossing[1] as string) === 'points')
      return 'point';
    return undefined;
  };

  const use = (path: string, ref: string, allowed?: readonly ElementKind[]) => {
    const kind = resolve(ref);
    if (!kind) {
      const base = ref.replace(/[.@].*$/, '');
      const later = definedIn.get(base);
      issues.push({
        path,
        message:
          later !== undefined && !known.has(base)
            ? `"${ref}" is used before it exists: it is made in step ${later}, and a step may only use elements made earlier`
            : `"${ref}" is not defined by any earlier step`,
      });
    } else if (allowed && !allowed.includes(kind)) {
      issues.push({
        path,
        message: `"${ref}" is ${article(kind)} ${kind}, but this needs ${oneOf(allowed)}`,
      });
    }
  };

  const checkElement = (path: string, el: ElementSpec) => {
    if ('point' in el || 'points' in el) {
      const spec = 'point' in el ? el.point : el.points;
      const at = `${path}.${'point' in el ? 'point' : 'points'}`;
      spec.meet.forEach((r, i) => use(`${at}.meet[${i}]`, r, CURVES));
      if ('point' in el && el.point.pick) {
        const pick = el.point.pick;
        for (const key of ['nearest', 'farthest'] as const) {
          if (pick[key]) use(`${at}.pick.${key}`, pick[key], ['point']);
        }
        for (const key of ['inside', 'outside'] as const) {
          if (pick[key])
            use(`${at}.pick.${key}`, pick[key], ['circle', 'polygon']);
        }
      }
    } else if ('line' in el) {
      const l = el.line;
      const at = `${path}.line`;
      if (Array.isArray(l.through))
        l.through.forEach((r, i) => use(`${at}.through[${i}]`, r, ['point']));
      else use(`${at}.through`, l.through, ['point']);
      if ('perpendicularTo' in l)
        use(`${at}.perpendicularTo`, l.perpendicularTo, ['line']);
      if ('parallelTo' in l) use(`${at}.parallelTo`, l.parallelTo, ['line']);
      if ('bisects' in l)
        l.bisects.forEach((r, i) => use(`${at}.bisects[${i}]`, r, ['point']));
    } else if ('circle' in el) {
      const c = el.circle;
      const at = `${path}.circle`;
      use(`${at}.centre`, c.centre, ['point']);
      if ('through' in c) use(`${at}.through`, c.through, ['point']);
      if ('radiusOf' in c) use(`${at}.radiusOf`, c.radiusOf, ['circle']);
      if ('radiusFrom' in c)
        c.radiusFrom.forEach((r, i) =>
          use(`${at}.radiusFrom[${i}]`, r, ['point']),
        );
      if ('tangentTo' in c)
        c.tangentTo.forEach((r, i) =>
          use(`${at}.tangentTo[${i}]`, r, ['line', 'circle']),
        );
    } else if ('polygon' in el) {
      el.polygon.forEach((r, i) => use(`${path}.polygon[${i}]`, r, ['point']));
    } else {
      const { of, by } = el.repeat;
      if (by.startsWith('mirror:'))
        use(`${path}.repeat.by`, by.slice('mirror:'.length), ['line']);
      of.forEach((r, i) => {
        if (r.includes('@')) {
          issues.push({
            path: `${path}.repeat.of[${i}]`,
            message: `"${r}" is already a copy; repeat the original instead`,
          });
          return;
        }
        use(`${path}.repeat.of[${i}]`, r, [
          'point',
          'line',
          'circle',
          'polygon',
        ]);
      });
    }
  };

  /** Registers what an element defines, including a repeat's copies. */
  const define = (name: string, el: ElementSpec) => {
    const kind = Object.keys(el)[0] as ElementKind;
    known.set(name, kind);
    if ('repeat' in el) {
      for (const orig of el.repeat.of) {
        const origKind = resolve(orig);
        if (!origKind || origKind === 'points' || origKind === 'repeat')
          continue;
        for (let i = 1; i <= copyCount(el.repeat.by); i++)
          known.set(`${orig}@${i}`, origKind);
      }
    }
  };

  t.steps.forEach((step, si) => {
    const sp = `steps[${si}]`;
    if (step.id !== si + 1) {
      issues.push({
        path: `${sp}.id`,
        message: `steps are numbered 1, 2, 3, … in order; expected ${si + 1}, got ${step.id}`,
      });
    }
    for (const [name, el] of Object.entries(step.create)) {
      const path = `${sp}.create.${name}`;
      if (known.has(name)) {
        issues.push({
          path,
          message: `"${name}" is already defined; every element needs its own name`,
        });
        continue;
      }
      checkElement(path, el);
      define(name, el);
    }
    step.highlight?.forEach((r, i) => use(`${sp}.highlight[${i}]`, r));
  });

  t.ink.paths.forEach((p, pi) =>
    p.through.forEach((r, i) =>
      use(`ink.paths[${pi}].through[${i}]`, r, ['point']),
    ),
  );
  use('pattern.cell', t.pattern.cell, ['polygon']);

  const pieceNames = new Set<string>();
  t.expect.pieces.forEach((p, i) => {
    if (pieceNames.has(p.name))
      issues.push({
        path: `expect.pieces[${i}].name`,
        message: `piece "${p.name}" is listed twice`,
      });
    pieceNames.add(p.name);
  });
  if (t.expect.pieceTypes !== t.expect.pieces.length) {
    issues.push({
      path: 'expect.pieceTypes',
      message: `says ${t.expect.pieceTypes} piece types, but expect.pieces lists ${t.expect.pieces.length}`,
    });
  }
  for (const name of Object.keys(t.pattern.colors)) {
    if (!pieceNames.has(name)) {
      issues.push({
        path: `pattern.colors.${name}`,
        message: `"${name}" is not a piece named in expect.pieces`,
      });
    }
  }
  const placements = t.pattern.placements;
  placements?.rules.forEach((rule, i) => {
    if (!pieceNames.has(rule.piece)) {
      issues.push({
        path: `pattern.placements.rules.${i}.piece`,
        message: `"${rule.piece}" is not a piece named in expect.pieces`,
      });
    }
    const [m, n] = placements.repeat;
    if (rule.cell && (rule.cell[0] >= m || rule.cell[1] >= n)) {
      issues.push({
        path: `pattern.placements.rules.${i}.cell`,
        message: `cell ${rule.cell.join(',')} is outside the ${m}×${n} repeat`,
      });
    }
  });
  for (const name of Object.keys(t.expect.crossings ?? {})) {
    use(`expect.crossings.${name}`, name, ['points']);
  }
  return issues;
}
