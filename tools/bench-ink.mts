/**
 * The app's share of pressing Ink in draw along, in Node. Run from the
 * repo root:
 * node --conditions=@tastir/source --import tsx tools/bench-ink.mts [ids...]
 *
 * Each tutorial is drawn for the learner step by step, as draw along does,
 * then its ink is prepared as the worker prepares it (cold, then warm from
 * the worker's cache), and the result is serialized and read back the way
 * a worker's message is (v8 serialization is the structured clone).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { deserialize, serialize } from 'node:v8';
import {
  checkStep,
  evaluate,
  hiddenHelpers,
} from '../packages/engine/src/index.js';
import { parseTutorial, type Tutorial } from '../packages/schema/src/index.js';
import { loadModel, shownBeats } from '../apps/player/src/app/model.js';
import { emptyDraft, type Draft } from '../apps/player/src/editor/document.js';
import { drawForMe } from '../apps/player/src/along/drawForMe.js';
import { prepareInk } from '../apps/player/src/along/inkWork.js';
import { takeTimings } from '../apps/player/src/along/timing.js';

const ids = process.argv.slice(2);
const list = ids.length
  ? ids
  : [
      'bou-inania-rosette',
      'bou-inania-twelve-fold-wall',
      'kurt-eight-fold-zellige-shifted',
    ];

const ms = (n: number) => n.toFixed(0);
const kb = (n: number) => `${(n / 1024).toFixed(0)} kB`;

console.log(`Node ${process.version}; milliseconds`);
for (const id of list) {
  const json = JSON.parse(
    readFileSync(resolve('tutorials', `${id}.json`), 'utf8'),
  );
  const model = loadModel(json);
  const t: Tutorial = parseTutorial(json);
  const optional = hiddenHelpers(model.scene, t);
  const shapes = new Set([t.pattern.cell]);
  let draft: Draft = emptyDraft(`${t.id}-along`, t.title);
  for (const beat of shownBeats(t)) {
    draft =
      drawForMe(t, model.scene, draft, beat, 'Drawn.', shapes, optional) ??
      draft;
    const board = evaluate({ steps: draft.steps } as Tutorial);
    if (!checkStep(model.scene, board, beat, undefined, shapes, optional).done)
      throw new Error(`${id}: beat ${beat} not drawn`);
  }
  let start = performance.now();
  const ready = prepareInk(model, draft);
  const cold = performance.now() - start;
  const parts = takeTimings();
  if ('reason' in ready) throw new Error(`${id}: ${ready.reason}`);
  start = performance.now();
  prepareInk(model, draft);
  const warm = performance.now() - start;
  takeTimings();
  start = performance.now();
  const bytes = serialize(ready);
  const write = performance.now() - start;
  start = performance.now();
  deserialize(bytes);
  const read = performance.now() - start;
  const sizes = Object.entries(ready)
    .map(([k, v]) => `${k} ${kb(serialize(v).length)}`)
    .join(', ');
  console.log(
    `${id}: ${ready.pieces.length} bits; prepare cold ${ms(cold)} (${Object.entries(
      parts,
    )
      .map(([k, v]) => `${k} ${ms(v)}`)
      .join(
        ', ',
      )}), warm ${ms(warm)}; message ${kb(bytes.length)}, write ${ms(write)}, read ${ms(read)}\n  ${sizes}`,
  );
}
