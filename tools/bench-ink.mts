/**
 * The app's share of pressing Ink in draw along, in Node. Run from the
 * repo root:
 * node --conditions=@tastir/source --import tsx tools/bench-ink.mts [ids...]
 *
 * Each tutorial is drawn for the learner step by step, as draw along does,
 * then its ink is prepared as the worker prepares it (cold, then warm from
 * the worker's cache). What the worker sends is serialized and read back
 * the way a worker's message is (v8 serialization is the structured
 * clone), apart from its typed arrays, which are transferred; reading
 * includes building the page's pen graph from them.
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
import {
  finishInk,
  InkSession,
  prepareInk,
  readyOf,
} from '../apps/player/src/along/inkWork.js';
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
  // The pattern on the board, which the worker sends after the board.
  start = performance.now();
  finishInk(ready);
  const after = performance.now() - start;
  Object.assign(parts, takeTimings());
  start = performance.now();
  prepareInk(model, draft);
  const warm = performance.now() - start;
  takeTimings();
  // What the worker sends: its typed arrays are transferred, not copied,
  // so only the rest is cloned.
  const sent = new InkSession().prepare(model, draft);
  takeTimings();
  if ('reason' in sent) throw new Error(`${id}: ${sent.reason}`);
  const { parts: pen, ...rest } = sent;
  const arrays = Object.values(pen).reduce(
    (n, v) => n + (typeof v === 'string' ? 2 * v.length : v.byteLength),
    0,
  );
  const strings = { bitIds: pen.bitIds, dotKeys: pen.dotKeys };
  start = performance.now();
  const bytes = serialize({ ...rest, strings });
  const write = performance.now() - start;
  start = performance.now();
  const { strings: _strings, ...back } = deserialize(bytes);
  readyOf({ ...back, parts: pen });
  const read = performance.now() - start;
  const sizes = Object.entries(rest)
    .map(([k, v]) => `${k} ${kb(serialize(v).length)}`)
    .join(', ');
  console.log(
    `${id}: ${ready.pieces.length} bits; board cold ${ms(cold)}, pattern after it ${ms(after)} (${Object.entries(
      parts,
    )
      .map(([k, v]) => `${k} ${ms(v)}`)
      .join(
        ', ',
      )}), warm ${ms(warm)}; cloned ${kb(bytes.length)}, transferred ${kb(arrays)}, write ${ms(write)}, read and build ${ms(read)}\n  ${sizes}`,
  );
}
