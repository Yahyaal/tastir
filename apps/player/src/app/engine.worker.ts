// Evaluates tutorials and finds their pieces off the main thread, so the
// page stays responsive. Reports each stage as it starts.
import { computePattern, evaluate } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { withHelpers, withInking, type Model } from './model';
import type { Progress, Reply, Request } from './workerClient';

const post = (reply: Reply) => postMessage(reply);

onmessage = ({ data }: MessageEvent<Request>) => {
  const { id, json, inked } = data;
  const progress = (stage: Progress) => post({ id, kind: 'progress', stage });
  try {
    progress('checking');
    const tutorial = parseTutorial(json);
    progress('drawing');
    const scene = evaluate(tutorial);
    progress('pieces');
    const model: Model = {
      tutorial,
      scene,
      pattern: computePattern(scene, tutorial),
    };
    const hidden = withHelpers(model, false);
    const prepared = {
      ...model,
      helperView: {
        tutorial: hidden.tutorial,
        hide: hidden.hide ?? new Set<string>(),
        optional: hidden.optionalHelpers ?? new Set<string>(),
      },
    };
    post({ id, kind: 'done', model: withInking(prepared, inked).model });
  } catch (e) {
    post({
      id,
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    });
  }
};
