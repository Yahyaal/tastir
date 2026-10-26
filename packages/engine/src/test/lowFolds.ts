import { readFileSync } from 'node:fs';
import type { Tutorial } from '@tastir/schema';

const fixtures = JSON.parse(
  readFileSync(
    new URL('../../../../tutorials/fixtures/low-folds.json', import.meta.url),
    'utf8',
  ),
) as Record<'pm' | 'pmm' | 'cmm', Tutorial>;

/** Shared coordinate-free tutorials, excluded from the public catalog. */
export const lowFold = (group: 'pm' | 'pmm' | 'cmm'): Tutorial =>
  structuredClone(fixtures[group]);
