import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Photo } from '@tastir/schema';

/**
 * Where a photo of the real pattern is served from. A free photo ships in
 * the public photos/ folder. A private one (one we may not ship) lives in
 * docs/research, which only the dev server serves; the built app has no
 * address for it and shows a placeholder instead.
 */
export function photoSrc(
  photo: Photo,
  dev: boolean = import.meta.env.DEV,
): string | undefined {
  if (!photo.private) return `${import.meta.env.BASE_URL}photos/${photo.file}`;
  return dev ? `/__review/research/${photo.file}` : undefined;
}

/**
 * The original: a photo of the real pattern, shown beside the wall so the
 * two can be compared, with its credit. Several photos are shown one at a
 * time.
 */
export function Original({
  photos,
  dev = import.meta.env.DEV,
}: {
  photos: readonly Photo[];
  dev?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const [full, setFull] = useState(false);
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const selected = photos[shown] ? shown : 0;
  const photo = photos[selected];
  if (!photo) return null;
  const source = photoSrc(photo, dev);
  const missing = Boolean(source && unavailable.has(source));
  const src = missing ? undefined : source;
  const failed = () => {
    if (source) setUnavailable((files) => new Set([...files, source]));
  };
  return (
    <figure className="original" aria-label="The original">
      {src ? (
        <button
          type="button"
          className="photo-open"
          title="See the photo at full size"
          aria-label={`See the photo at full size: ${photo.caption}`}
          onClick={() => setFull(true)}
        >
          <img src={src} alt={photo.caption} onError={failed} />
        </button>
      ) : (
        <PhotoPlaceholder photo={photo} unavailable={missing} />
      )}
      <figcaption>
        {photo.caption}{' '}
        <span className="credit">
          Photo: {photo.creator}, {photo.license}.{' '}
          <a href={photo.url}>Source</a>
          {src && photo.private ? ' (shown on the dev server only)' : ''}
        </span>
        {photos.length > 1 ? (
          <span className="photo-nav">
            {photos.map((p, i) => (
              <button
                key={p.file}
                type="button"
                className="quiet"
                aria-pressed={i === selected}
                onClick={() => setShown(i)}
              >
                Photo {i + 1}
              </button>
            ))}
          </span>
        ) : null}
      </figcaption>
      {full ? (
        <FullSize
          photo={photo}
          src={src}
          onUnavailable={failed}
          onClose={() => setFull(false)}
        />
      ) : null}
    </figure>
  );
}

function PhotoPlaceholder({
  photo,
  unavailable = false,
}: {
  photo: Photo;
  unavailable?: boolean;
}) {
  return (
    <div className="photo-placeholder">
      <p>
        {unavailable
          ? 'This photo could not be loaded.'
          : 'A photo of the real pattern is to come.'}
      </p>
      <p>
        {unavailable
          ? 'You can still see it at '
          : 'We are looking for one we may show here. Meanwhile you can see it at '}
        <a href={photo.url}>its source</a>.
      </p>
    </div>
  );
}

/**
 * A photo over the whole page: fitted to the window, or at its actual size
 * to scroll around (a click on the photo switches). Esc, the close button or
 * a click outside the photo closes it.
 */
function FullSize({
  photo,
  src,
  onClose,
  onUnavailable,
}: {
  photo: Photo;
  src?: string;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const [actual, setActual] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Over the whole page, outside the comparison's own layout.
  return createPortal(
    <div
      className="full-size"
      role="dialog"
      aria-modal="true"
      aria-label={`Full size: ${photo.caption}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="full-size-bar">
        <span>
          {photo.caption} Photo: {photo.creator}, {photo.license}.
        </span>
        {src ? (
          <button
            type="button"
            className="secondary"
            aria-pressed={actual}
            onClick={() => setActual(!actual)}
          >
            {actual ? 'Fit to the window' : 'Actual size'}
          </button>
        ) : null}
        <button type="button" className="secondary" onClick={onClose}>
          Close
        </button>
      </div>
      <div
        className={src && actual ? 'full-size-view actual' : 'full-size-view'}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {src ? (
          <img
            src={src}
            alt={photo.caption}
            onError={onUnavailable}
            onClick={() => setActual(!actual)}
          />
        ) : (
          <PhotoPlaceholder photo={photo} unavailable />
        )}
      </div>
    </div>,
    document.body,
  );
}
