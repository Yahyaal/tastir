import { LIBRARY } from './library';
import { loadModel, withHelpers } from './model';

// With helper lines hidden, a step's text must match what is drawn: every
// shown step (or part) that makes hidden helper lines, and the first shown
// step after a skipped one, gives a textWithoutHelpers.
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
        const leavesOut = (made: (name: string) => boolean) =>
          [...model.scene.elements.values()].some(
            (el) =>
              el.step === step.id &&
              made(el.name) &&
              el.geometry.kind === 'line' &&
              hide.has(el.name),
          );
        // With parts, each part that leaves lines out has its own text;
        // an element is a part's when it or its copies (name@2, name.1)
        // come from the part's create.
        const parts = step.parts ?? [];
        // After a skipped step, the first part must say so too.
        const firstAfterSkip = afterSkip;
        const written =
          step.textWithoutHelpers !== undefined ||
          (parts.length > 0 &&
            parts.every(
              (p, i) =>
                p.textWithoutHelpers !== undefined ||
                ((i > 0 || !firstAfterSkip) &&
                  !leavesOut((name) =>
                    Object.keys(p.create).includes(
                      name.split(/[@.]/)[0] ?? name,
                    ),
                  )),
            ));
        if ((leavesOut(() => true) || firstAfterSkip) && !written)
          missing.push(step.id);
        afterSkip = false;
      }
      expect(missing).toEqual([]);
    });
  },
);
