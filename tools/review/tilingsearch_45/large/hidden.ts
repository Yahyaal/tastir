// Lists the lines each step makes that the player hides when helper lines
// are off, to write the steps' textWithoutHelpers.
//
//   tsx --conditions=@tastir/source tools/review/tilingsearch_45/large/hidden.ts <id>
import { readFileSync } from 'node:fs';
import { loadModel, withHelpers } from '../../../../packages/project-core/src/model.ts';

const id = process.argv[2];
const json = JSON.parse(
  readFileSync(new URL(`../../../../tutorials/${id}.json`, import.meta.url), 'utf8'),
);
const model = loadModel(json);
const hide = withHelpers(model, false).hide ?? new Set<string>();
const by = new Map<number, string[]>();
for (const el of model.scene.elements.values())
  if (hide.has(el.name)) by.set(el.step, [...(by.get(el.step) ?? []), el.name]);
for (const [s, names] of [...by].sort((a, b) => a[0] - b[0]))
  console.log(s, names.join(' '));
