/** A tutorial file from tutorials/; it is loaded (in the worker) when shown. */
export interface Entry {
  /** The file name without .json; the address of the tutorial. */
  readonly id: string;
  readonly json: unknown;
}

// Every file in tutorials/: adding one needs no code change.
const files = import.meta.glob<unknown>('../../../../tutorials/*.json', {
  eager: true,
  import: 'default',
});

/** The tutorial files, by address, in order. */
export function entriesOf(files: Record<string, unknown>): Entry[] {
  return Object.entries(files)
    .map(([path, json]) => ({
      id: path.replace(/^.*\//, '').replace(/\.json$/, ''),
      json,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const LIBRARY: readonly Entry[] = entriesOf(files);
