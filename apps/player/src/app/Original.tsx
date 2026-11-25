import { useCallback, useEffect, useRef, useState } from 'react';
import { useModalFocus } from './useModalFocus';
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
  selected: controlledSelected,
  onSelect,
  showFullButton = true,
  onUnavailable,
  onWipe,
}: {
  photos: readonly Photo[];
  dev?: boolean;
  /** Controlled index into `photos`, when the parent shares the active photo. */
  selected?: number;
  onSelect?: (photo: number) => void;
  /** Show the full-size button inside the photo toolbar (true by default). */
  showFullButton?: boolean;
  onUnavailable?: (src: string) => void;
  /** Lays the photo shown (its index) over the wall, to wipe between the
   * two. */
  onWipe?: (photo: number) => void;
}) {
  const [shown, setShown] = useState(0);
  const [full, setFull] = useState(false);
  const close = useCallback(() => setFull(false), []);
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const current = controlledSelected ?? shown;
  const selected = photos[current] ? current : 0;
  const selectPhoto = (i: number) => {
    setShown(i);
    onSelect?.(i);
  };
  const photo = photos[selected];
  if (!photo) return null;
  const source = photoSrc(photo, dev);
  const missing = Boolean(source && unavailable.has(source));
  const src = missing ? undefined : source;
  const failed = () => {
    if (source) {
      setUnavailable((files) => new Set([...files, source]));
      onUnavailable?.(source);
    }
  };
  return (
    <figure className="original" aria-label="The original">
      {src ? (
        <ZoomPhoto
          key={src}
          src={src}
          caption={photo.caption}
          onError={failed}
          onFull={showFullButton ? () => setFull(true) : undefined}
          onWipe={onWipe ? () => onWipe(selected) : undefined}
        />
      ) : (
        <PhotoPlaceholder photo={photo} unavailable={missing} />
      )}
      <figcaption>
        {photo.caption}{' '}
        <span className="credit">
          Photo: {photo.creator}, {photo.license}.{' '}
          <a href={photo.url} target="_blank" rel="noreferrer">
            Source
          </a>
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
                onClick={() => selectPhoto(i)}
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
          onClose={close}
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
        <a href={photo.url} target="_blank" rel="noreferrer">
          its source
        </a>
        .
      </p>
    </div>
  );
}

/**
 * A photo over the whole page: fitted to the window, or at its actual size
 * to scroll around (a click on the photo switches). Esc, the close button or
 * a click outside the photo closes it.
 */
export function FullSize({
  photo,
  src,
  onClose,
  onUnavailable,
  returnRoot = '.original',
  returnTarget = '.photo-placeholder a',
}: {
  photo: Photo;
  src?: string;
  onClose: () => void;
  onUnavailable: () => void;
  returnRoot?: string;
  returnTarget?: string;
}) {
  const [actual, setActual] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useModalFocus(dialog, closeButton, onClose, returnRoot, returnTarget);
  // Over the whole page, outside the comparison's own layout.
  return createPortal(
    <div
      ref={dialog}
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
        <div className="full-size-actions">
          {src ? (
            <button
              type="button"
              className="secondary full-size-zoom"
              aria-pressed={actual}
              onClick={() => setActual(!actual)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5M8 11h6" />
                {actual ? null : <path d="M11 8v6" />}
              </svg>
              {actual ? 'Fit to the window' : 'Actual size'}
            </button>
          ) : null}
          <button
            ref={closeButton}
            type="button"
            className="full-size-close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            Close
          </button>
        </div>
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

const MAX_ZOOM = 6;

/**
 * The photo beside the wall, to look closer at: a single click toggles zoom
 * about the pointer, the wheel or a pinch zooms smoothly, a drag pans once
 * zoomed, and the buttons zoom in, out, open full size, or lay it over the
 * wall to wipe.
 */
function ZoomPhoto({
  src,
  caption,
  onError,
  onFull,
  onWipe,
}: {
  src: string;
  caption: string;
  onError: () => void;
  onFull?: () => void;
  onWipe?: () => void;
}) {
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | undefined>(undefined);
  const tap = useRef<{ x: number; y: number; moved: boolean } | undefined>(
    undefined,
  );
  // Zoom by f about a point in the box (its centre when none is given),
  // keeping the photo over the box.
  const zoom = (f: number, at?: { x: number; y: number }) =>
    setView((v) => {
      const r = box.current?.getBoundingClientRect();
      const w = r?.width ?? 0;
      const h = r?.height ?? 0;
      const k = Math.min(MAX_ZOOM, Math.max(1, v.k * f));
      const px = at ? at.x : w / 2;
      const py = at ? at.y : h / 2;
      const x = px - ((px - v.x) * k) / v.k;
      const y = py - ((py - v.y) * k) / v.k;
      return clamp({ k, x, y }, w, h);
    });
  const clamp = (
    v: { k: number; x: number; y: number },
    w: number,
    h: number,
  ) =>
    v.k === 1
      ? { k: 1, x: 0, y: 0 }
      : {
          k: v.k,
          x: Math.min(0, Math.max(w - w * v.k, v.x)),
          y: Math.min(0, Math.max(h - h * v.k, v.y)),
        };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  // The wheel zooms the photo, not the page: a listener that may prevent
  // the page's scroll (React's own is passive).
  const wheel = useRef<(e: WheelEvent) => void>(() => undefined);
  wheel.current = (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, local(e));
  };
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const on = (e: WheelEvent) => wheel.current(e);
    el.addEventListener('wheel', on, { passive: false });
    return () => el.removeEventListener('wheel', on);
  }, []);
  return (
    <div className="photo-zoom">
      <div
        className={`photo-zoom-box${view.k > 1 ? ' is-zoomed' : ''}${dragging ? ' is-dragging' : ''}`}
        ref={box}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          const pt = local(e);
          if (pointers.current.size === 0) {
            tap.current = { x: pt.x, y: pt.y, moved: false };
          } else if (tap.current) {
            tap.current.moved = true;
          }
          pointers.current.set(e.pointerId, pt);
          pinch.current = undefined;
          if (view.k > 1) setDragging(true);
        }}
        onPointerMove={(e) => {
          const was = pointers.current.get(e.pointerId);
          if (!was) return;
          const now = local(e);
          if (
            tap.current &&
            !tap.current.moved &&
            Math.hypot(now.x - tap.current.x, now.y - tap.current.y) > 5
          ) {
            tap.current.moved = true;
          }
          pointers.current.set(e.pointerId, now);
          const all = [...pointers.current.values()];
          if (all.length === 2 && all[0] && all[1]) {
            const d = Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y);
            if (pinch.current)
              zoom(d / pinch.current, {
                x: (all[0].x + all[1].x) / 2,
                y: (all[0].y + all[1].y) / 2,
              });
            pinch.current = d;
            return;
          }
          if (view.k === 1) return;
          const r = box.current?.getBoundingClientRect();
          setView((v) =>
            clamp(
              { k: v.k, x: v.x + now.x - was.x, y: v.y + now.y - was.y },
              r?.width ?? 0,
              r?.height ?? 0,
            ),
          );
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = undefined;
          setDragging(false);
          const pending = tap.current;
          if (pointers.current.size === 0) {
            tap.current = undefined;
            if (pending && !pending.moved) {
              if (view.k > 1) setView({ k: 1, x: 0, y: 0 });
              else zoom(2.5, local(e));
            }
          }
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = undefined;
          tap.current = undefined;
          setDragging(false);
        }}
      >
        <img
          src={src}
          alt={caption}
          onError={onError}
          draggable={false}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          }}
        />
      </div>
      <div
        className="photo-zoom-tools"
        role="group"
        aria-label="Zoom the photo"
      >
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={view.k >= MAX_ZOOM}
          onClick={() => zoom(1.5)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={view.k <= 1}
          onClick={() => zoom(1 / 1.5)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12" />
          </svg>
        </button>
        {onFull ? (
          <button
            type="button"
            className="photo-open"
            title="See the photo at full size"
            aria-label={`See the photo at full size: ${caption}`}
            onClick={onFull}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        ) : null}
        {onWipe ? (
          <button
            type="button"
            className="photo-wipe-btn"
            aria-label="Lay the photo over the wall"
            title="Lay the photo over the wall, and wipe between the two"
            onClick={onWipe}
          >
            <span className="photo-tool-label" aria-hidden="true">
              Wipe over wall
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v18M9 8l-4 4 4 4M15 8l4 4-4 4" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
