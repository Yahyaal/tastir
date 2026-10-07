// Evaluates tutorials and finds their pieces off the main thread, so the
// page stays responsive. Reports each stage as it starts.
import { computePattern, evaluate } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { withInking, type Model } from './model';
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
    post({ id, kind: 'done', model: withInking(model, inked).model });
  } catch (e) {
    post({
      id,
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    });
  }
};
