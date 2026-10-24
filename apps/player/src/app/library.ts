import fixtures from 'virtual:tastir-fixtures';
import catalog from '../generated/catalog';
import hidden from './hidden.json';

/** Library metadata and previews are prepared at build time; geometry loads on demand. */
export interface Preview {
  readonly title: string;
  /** A shorter name for the card, and the line under it (tutorial.short,
   * tutorial.subtitle). */
  readonly short?: string;
  readonly subtitle?: string;
  readonly style: string;
  readonly level: string;
  readonly fold: number;
  readonly steps: number;
  readonly photos: boolean;
  readonly verification?: import('@tastir/schema').Tutorial['verification'];
  readonly thumbnail: string;
}
export interface Entry {
  readonly id: string;
  /** Raw data for user patterns/tests, or an async loader for library tutorials. */
  readonly json: unknown;
  readonly preview?: Preview;
}
const loaders = import.meta.glob<unknown>('../../../../tutorials/*.json', {
  import: 'default',
});
export function entriesOf(files: Record<string, unknown>): Entry[] {
  return Object.entries(files)
    .map(([path, json]) => ({
      id: path.replace(/^.*\//, '').replace(/\.json$/, ''),
      json,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
/**
 * Patterns the owner keeps out of the library while deciding whether they
 * need more work or should go (`hidden.json`, written by the Hide button
 * on the dev server). They still open from a direct link, so saved designs
 * and share links keep working.
 */
export const isHidden = (id: string): boolean =>
  (hidden as readonly string[]).includes(id);

/**
 * The patterns the library, its menus and next/previous show: all of them
 * on the dev server (hidden ones carry a badge), else the ones not hidden.
 */
export const listed = (
  entries: readonly Entry[],
  showHidden: boolean = import.meta.env.DEV,
): readonly Entry[] =>
  showHidden ? entries : entries.filter((e) => !isHidden(e.id));

export const LIBRARY: readonly Entry[] =
  import.meta.env.MODE === 'test'
    ? entriesOf(fixtures)
    : catalog.map(({ id, ...preview }) => ({
        id,
        preview,
        json: loaders[`../../../../tutorials/${id}.json`],
      }));
