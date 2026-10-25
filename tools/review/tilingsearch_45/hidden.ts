// Prints which construction lines the player hides when helper lines are off,
// step by step, so each such step can be given a textWithoutHelpers.
//   tsx --conditions=@tastir/source tools/review/tilingsearch_45/hidden.ts <id>
import { readFileSync } from 'node:fs';
import { evaluate, hiddenHelpers } from '../../../packages/engine/src/index.ts';
import { parseTutorial } from '../../../packages/schema/src/index.ts';

const id = process.argv[2];
const t = parseTutorial(
  JSON.parse(
    readFileSync(
      new URL(`../../../tutorials/${id}.json`, import.meta.url),
      'utf8',
    ),
  ),
);
const scene = evaluate(t);
const hide = hiddenHelpers(scene, t);
const byStep = new Map<number, string[]>();
for (const el of scene.elements.values())
  if (hide.has(el.name))
    byStep.set(el.step, [...(byStep.get(el.step) ?? []), el.name]);
for (const [s, names] of byStep) console.log(`step ${s}: ${names.join(' ')}`);
