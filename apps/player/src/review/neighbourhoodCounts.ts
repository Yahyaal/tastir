/** Candidate fingerprint: occurrence density in an area equal to the largest piece.
 * This is invariant under uniform scale and choosing a larger repeating tile.
 * It is a local signature, not a proof that two whole arrangements are equal.
 */
export function neighbourhoodCounts(
  sequences: readonly string[],
  normalizedArea: number,
): string {
  if (!Number.isFinite(normalizedArea) || normalizedArea <= 0)
    throw new Error(
      'Neighbourhood counts need a positive normalized cell area.',
    );
  const counts = new Map<string, number>();
  for (const sequence of sequences)
    counts.set(sequence, (counts.get(sequence) ?? 0) + 1);
  return JSON.stringify(
    [...counts]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sequence, count]) => [
        sequence,
        Number((count / normalizedArea).toFixed(6)),
      ]),
  );
}
