import type { Tutorial } from './tutorial.js';

/** The pattern fields that make a colouring, which a place may replace. */
const COLOURING = [
  'palette',
  'look',
  'colors',
  'placements',
  'rings',
  'original',
] as const;

/** The tutorial's fields that belong to its own place. */
const PLACE_OWN = [
  'places',
  'short',
  'subtitle',
  'region',
  'photos',
  'verification',
] as const;

/** The ids of a tutorial's other places, in order. */
export const placeIds = (t: Tutorial): string[] =>
  (t.places ?? []).map((p) => p.id);

/**
 * The tutorial as found at one of its places: the same construction, ink
 * and pieces under the place's name, credits and colouring. The place's
 * credits come first, then the tutorial's, which the construction is
 * still taken from. The tutorial's own id gives the tutorial itself.
 */
export function atPlace(t: Tutorial, id: string): Tutorial {
  if (id === t.id) return t;
  const place = t.places?.find((p) => p.id === id);
  if (!place) throw new Error(`${t.id} has no place “${id}”.`);
  const own = place.pattern ?? {};
  const pattern: Record<string, unknown> = { ...t.pattern };
  // A place with a colouring of its own takes none of the tutorial's,
  // except the shape colours when it gives none.
  if (Object.keys(own).length)
    for (const key of COLOURING) if (key !== 'colors') delete pattern[key];
  Object.assign(pattern, own);
  // The tutorial's own name, place and photos stay with it.
  const rest: Partial<Tutorial> = { ...t };
  for (const key of PLACE_OWN) delete rest[key];
  return {
    ...(rest as Tutorial),
    id: place.id,
    title: place.title,
    ...(place.short ? { short: place.short } : {}),
    ...(place.subtitle ? { subtitle: place.subtitle } : {}),
    style: place.style,
    ...(place.region ? { region: place.region } : {}),
    credits: [...place.credits, ...t.credits],
    ...(place.photos ? { photos: place.photos } : {}),
    pattern: pattern as Tutorial['pattern'],
  };
}

/** The tutorial and each of its places, as tutorials of their own. */
export const withPlaces = (t: Tutorial): Tutorial[] => [
  t,
  ...placeIds(t).map((id) => atPlace(t, id)),
];
