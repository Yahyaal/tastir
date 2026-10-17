import { inkStrokes } from '@tastir/engine';
import {
  DraftShape,
  ElementSpec,
  partsOf,
  type Tutorial,
} from '@tastir/schema';
import {
  ApplyStepsShape,
  type Snapshot,
  type ToolCall,
} from '@tastir/agent-protocol';
import { addStep, check, deleteSteps, type Draft } from '../editor/document';
import {
  draftHistoryObservation,
  editDraft,
  travelDraft,
} from '../editor/history';
import {
  constructionSpec,
  constructionText,
  editSegments,
  emptyDrawing,
} from './drawing';
import { withTile, tutorialOf, tileOf } from '../editor/finish';
import { addPattern } from '../editor/patterns';

import { getPageEditor } from '../editor/agentBridge';
export { registerPageEditor } from '../editor/agentBridge';

const revisions = new WeakMap<Draft, number>();
let nextRevision = 0;
export const pageEditorRevision = () => {
  const current = getPageEditor();
  if (!current) return '';
  const { history, id } = current;
  if (!revisions.has(history.now)) revisions.set(history.now, ++nextRevision);
  return JSON.stringify([
    id,
    revisions.get(history.now),
    history.past.length,
    history.future.length,
  ]);
};
const segments = (draft: Draft) =>
  (draft.ink?.paths ?? []).flatMap((p, i) =>
    'through' in p && p.through.length === 2
      ? [{ id: `ink${i}`, from: p.through[0]!, to: p.through[1]! }]
      : [],
  );
export function pageEditorObservation() {
  const current = getPageEditor();
  if (!current) return {};
  return {
    editor: {
      steps: current.history.now.steps.map((s) => ({
        id: s.id,
        text: s.text.slice(0, 1000),
        names: partsOf(s).flatMap((p) => Object.keys(p.create)),
      })),
      autoSaved: current.autoSaved,
    },
    segments: segments(current.history.now),
    history: draftHistoryObservation(current.history),
    canSave: true,
  };
}

/** Engine and schema validation complete before the live editor receives a batch. */
export function checkedDraftEdit(draft: Draft, call: ToolCall): Draft {
  let next = draft;
  const checked = check(draft);
  if ([...checked.status.values()].some((s) => !s.ok))
    throw new Error('Repair the existing broken construction steps first.');
  if (call.name === 'apply_steps') {
    const edit = ApplyStepsShape.parse(call.arguments);
    if (
      new Set(edit.remove).size !== edit.remove.length ||
      edit.remove.some((id) => !draft.steps.some((s) => s.id === id))
    )
      throw new Error('Remove only existing step IDs, once each.');
    next = deleteSteps(draft, edit.remove);
    const weights = new Map(
      [...checked.scene.elements].map(([name, el]) => [
        name,
        el.geometry.kind === 'group' ? el.geometry.members.length + 1 : 1,
      ]),
    );
    let budget = checked.scene.elements.size;
    for (const step of edit.steps) {
      let create: unknown;
      try {
        create = JSON.parse(step.createJson);
      } catch {
        throw new Error(
          'createJson must be valid JSON mapping new names to element specs.',
        );
      }
      if (
        !create ||
        typeof create !== 'object' ||
        Array.isArray(create) ||
        !Object.keys(create).length
      )
        throw new Error(
          'Each step must create at least one named construction element.',
        );
      if (Object.keys(create).length > 64)
        throw new Error('Use at most 64 named elements per step.');
      for (const [name, value] of Object.entries(create)) {
        const spec = ElementSpec.parse(value);
        let weight = 'points' in spec ? 128 : 1;
        if ('polygon' in spec && spec.polygon.length > 64)
          throw new Error('Use at most 64 polygon corners.');
        if ('repeat' in spec) {
          if (spec.repeat.of.length > 64)
            throw new Error('Repeat at most 64 elements per step.');
          const copies = spec.repeat.by.startsWith('rot')
            ? Number(spec.repeat.by.slice(3))
            : 2;
          weight =
            spec.repeat.of.reduce(
              (sum, ref) => sum + (weights.get(ref) ?? 1),
              0,
            ) *
              copies +
            1;
        }
        weights.set(name, weight);
        budget += weight;
        if (budget > 5000)
          throw new Error(
            'This batch would exceed the 5000-element construction budget.',
          );
      }
      next = addStep(next, {
        text: step.text,
        create: create as Record<string, never>,
      });
    }
  } else if (call.name === 'construct') {
    const ids = new Set(
      call.arguments.remove.map((name) => {
        const step = draft.steps.find((s) =>
          partsOf(s).some((p) => Object.keys(p.create).includes(name)),
        );
        if (!step)
          throw new Error('Remove only existing named construction elements.');
        if (partsOf(step).flatMap((p) => Object.keys(p.create)).length !== 1)
          throw new Error(
            'Use apply_steps to remove an entire multi-element step explicitly.',
          );
        return step.id;
      }),
    );
    next = deleteSteps(draft, [...ids]);
    for (const op of call.arguments.add)
      next = addStep(next, {
        text: constructionText(op),
        create: { [op.name]: constructionSpec(op) },
      });
  } else if (call.name === 'edit_segments') {
    const h = { ...emptyDrawing(), segments: segments(draft) };
    const edited = editSegments(h, call.arguments, checked.scene);
    const kept = (draft.ink?.paths ?? []).filter(
      (_, i) => !call.arguments.remove.includes(`ink${i}`),
    );
    for (const side of edited.segments.filter(
      (s) => !h.segments.some((before) => before.id === s.id),
    )) {
      let name = side.id;
      while (check(next).scene.elements.has(name)) name += '_';
      next = addStep(next, {
        text: `Join ${side.from} to ${side.to}.`,
        create: { [name]: { line: { through: [side.from, side.to] } } },
      });
      kept.push({ through: [side.from, side.to] });
    }
    if (kept.length) next = { ...next, ink: { ...draft.ink, paths: kept } };
    else {
      const { ink: _ink, ...rest } = next;
      next = rest;
    }
  } else if (call.name === 'set_tile') {
    let name = 'AssistantTile';
    while (checked.scene.elements.has(name)) name += '_';
    next = withTile(
      addStep(next, {
        text: 'Choose the repeating tile.',
        create: { [name]: { polygon: call.arguments.vertices } },
      }),
      name,
    );
    // The normal editor's tile and finishing checks enforce the actual lattice.
    tileOf(next, check(next).scene);
    const playable = tutorialOf(next);
    if ('reason' in playable) throw new Error(playable.reason);
    next = playable.tutorial;
  } else throw new Error('This tool does not edit construction steps.');
  if (next.steps.length > 500)
    throw new Error('Keep the construction within 500 steps.');
  const parsed = DraftShape.safeParse(next);
  if (!parsed.success)
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid construction.');
  const result = check(next);
  const failure = [...result.status.values()].find((s) => !s.ok);
  if (failure && !failure.ok) throw new Error(failure.reason);
  if (result.scene.elements.size > 5000)
    throw new Error('Keep the construction within 5000 elements.');
  if (next.ink?.paths.length) inkStrokes(result.scene, next as Tutorial);
  if (next.pattern?.cell) tileOf(next, result.scene);
  if (JSON.stringify(next) === JSON.stringify(draft))
    throw new Error('That edit makes no changes.');
  return next;
}

export function applyPageEditor(
  call: ToolCall,
  snapshot: Snapshot,
  requestId: string,
) {
  const current = getPageEditor();
  if (
    !current ||
    snapshot.screen?.route !== `edit/${current.id}` ||
    !snapshot.editor
  )
    throw new Error('Open the saved pattern in its normal editor first.');
  if (call.name === 'save_work') {
    const saved = addPattern({
      ...current.history.now,
      title: call.arguments.name,
    });
    if (!saved) throw new Error('The browser could not save this pattern.');
    return `Saved a new pattern “${saved.tutorial.title}” in Your work. Editor destination: editor:${saved.id}.`;
  }
  const next =
    call.name === 'travel_history'
      ? travelDraft(
          current.history,
          call.arguments.direction,
          call.arguments.steps,
          call.arguments.scope === 'assistant',
        )
      : editDraft(
          current.history,
          checkedDraftEdit(current.history.now, call),
          { source: 'assistant', requestId, label: call.arguments.label },
        );
  current.setHistory(next);
  current.committed(next.now);
  return 'Updated the open drawing through its normal Undo history. A fresh image follows. The editor keeps changes automatically; check editor.autoSaved for storage status.';
}
