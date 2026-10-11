import fixtures from 'virtual:tastir-fixtures';
import catalog from '../generated/catalog';

/** Library metadata and previews are prepared at build time; geometry loads on demand. */
export interface Preview {
  readonly title: string;
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
export const LIBRARY: readonly Entry[] =
  import.meta.env.MODE === 'test'
    ? entriesOf(fixtures)
    : catalog.map(({ id, ...preview }) => ({
        id,
        preview,
        json: loaders[`../../../../tutorials/${id}.json`],
      }));
