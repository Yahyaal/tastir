import { loadModel, type Model } from './model';

/** A tutorial file from tutorials/, loaded or with the reason it cannot be. */
export interface Entry {
  /** The file name without .json; the address of the tutorial. */
  readonly id: string;
  readonly json: unknown;
  readonly model?: Model;
  readonly error?: string;
}

// Every file in tutorials/: adding one needs no code change.
const files = import.meta.glob<unknown>('../../../../tutorials/*.json', {
  eager: true,
  import: 'default',
});

/** Loads each tutorial, keeping the engine's message for any it rejects. */
export function entriesOf(files: Record<string, unknown>): Entry[] {
  return Object.entries(files)
    .map(([path, json]) => {
      const id = path.replace(/^.*\//, '').replace(/\.json$/, '');
      try {
        return { id, json, model: loadModel(json) };
      } catch (e) {
        return { id, json, error: e instanceof Error ? e.message : String(e) };
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const LIBRARY: readonly Entry[] = entriesOf(files);
