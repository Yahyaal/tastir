import { LIBRARY } from './library';
import { loadModel, withHelpers } from './model';

// With helper lines hidden, a step's text must match what is drawn: every
// shown step that makes hidden helper lines, and the first shown step
// after a skipped one, gives a textWithoutHelpers.
describe.each(LIBRARY.map((e) => [e.id, e.json] as const))(
  '%s without helper lines',
  (_, json) => {
    it('has a text for every step that leaves lines out', () => {
      const model = loadModel(json);
      const hidden = withHelpers(model, false);
      const hide = hidden.hide ?? new Set<string>();
      const missing: number[] = [];
      let afterSkip = false;
      for (const step of model.tutorial.steps) {
        if (step.hidden) continue;
        const skipped = hidden.tutorial.steps.find(
          (s) => s.id === step.id,
        )?.hidden;
        if (skipped) {
          afterSkip = true;
          continue;
        }
        const leavesOut = [...model.scene.elements.values()].some(
          (el) =>
            el.step === step.id &&
            el.geometry.kind === 'line' &&
            hide.has(el.name),
        );
        const parts = step.parts ?? [];
        const written =
          step.textWithoutHelpers !== undefined ||
          (parts.length > 0 && parts.every((p) => p.textWithoutHelpers));
        if ((leavesOut || afterSkip) && !written) missing.push(step.id);
        afterSkip = false;
      }
      expect(missing).toEqual([]);
    });
  },
);
