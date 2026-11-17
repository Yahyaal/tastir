import type { PieceType } from '@tastir/engine';

/**
 * A piece type's name as a learner reads it (STYLE.9). Tutorials name their
 * pieces in short ids such as `pointed_star`, `long_hexagon` or `twelve`
 * (a twelve-sided piece); the player showed those as written. Underscores
 * become spaces, a bare number becomes "twelve-sided piece", and the
 * repeat's background is called the background. The tutorials keep their
 * ids, which the colouring and the tests use.
 */
const NUMBERS = new Set([
  'three',
  'four',
  'five',
  'seven',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'eight',
  'eighteen',
  'twenty',
  'six',
]);

export function pieceName(
  type: Pick<PieceType, 'name' | 'vertices'> | undefined,
): string {
  const raw = type?.name;
  if (!raw) return `${type?.vertices ?? 0}-corner piece`;
  const words = raw
    .replace(/@\d+$/, '')
    .split(/[_\s-]+/)
    .filter(Boolean);
  if (words.length === 1 && words[0] === 'ground') return 'background';
  const last = words[words.length - 1];
  if (last && NUMBERS.has(last)) {
    words[words.length - 1] = `${last}-sided`;
    words.push('piece');
  }
  return words.join(' ');
}

/**
 * The small line under a piece's name: a star by its points (half its
 * corners), any other piece by its corners.
 */
export function pieceDetail(
  type: Pick<PieceType, 'name' | 'vertices' | 'perCell'>,
): string {
  const star = /star/.test(type.name ?? '') && type.vertices % 2 === 0;
  const shape = star
    ? `${type.vertices / 2} points`
    : `${type.vertices} corners`;
  return `${shape} · ${type.perCell} per tile`;
}
