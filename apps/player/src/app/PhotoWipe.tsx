import { useRef, useState } from 'react';
import type { Photo } from '@tastir/schema';
import { photoSrc } from './Original';

/**
 * The real wall's photo controls, anchored in one fixed top-left bar:
 * closed, a single badge opens the photo beside the wall; open (in either
 * side-by-side or wipe), the same spot holds Hide photo, an in-place toggle
 * between Wipe over wall and Side by side, and Full size.
 */
export function PhotoBadge({
  photo,
  open,
  wiping = false,
  onToggle,
  onToggleWipe,
  onFullSize,
}: {
  photo: Photo;
  open: boolean;
  wiping?: boolean;
  onToggle: () => void;
  onToggleWipe?: () => void;
  onFullSize?: () => void;
}) {
  const src = photoSrc(photo);
  const badge = (
    <button
      type="button"
      className="photo-badge"
      aria-pressed={open}
      title={
        open
          ? 'Close the photo of the real wall'
          : 'A photo of the real pattern, beside the wall'
      }
      onClick={onToggle}
    >
      {src ? <img src={src} alt="" /> : null}
      <span>{open ? 'Hide photo' : 'Real wall'}</span>
    </button>
  );
  if (!open || (!onToggleWipe && !onFullSize)) return badge;
  return (
    <div className="photo-badge-group">
      {badge}
      {onToggleWipe ? (
        <button
          type="button"
          className="photo-mode-btn"
          aria-pressed={wiping}
          title={
            wiping
              ? 'Return to the photo beside the wall'
              : 'Lay the photo over the wall, and wipe between the two'
          }
          onClick={onToggleWipe}
        >
          {wiping ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M12 5v14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v18M9 8l-4 4 4 4M15 8l4 4-4 4" />
            </svg>
          )}
          <span>{wiping ? 'Side by side' : 'Wipe over wall'}</span>
        </button>
      ) : null}
      {onFullSize ? (
        <button
          type="button"
          className="photo-full-btn"
          aria-label={`See the photo at full size: ${photo.caption}`}
          title="See the photo at full size"
          onClick={onFullSize}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span className="photo-bar-label" aria-hidden="true">
            Full size
          </span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * The real wall over ours, wiped away by a golden handle: the photo shows
 * left of the handle, our wall right of it. Drag the handle, or focus it and
 * use the arrow keys.
 */
export function PhotoWipe({
  photo,
  onClose,
}: {
  photo: Photo;
  onClose?: () => void;
}) {
  const [at, setAt] = useState(50);
  const [missing, setMissing] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const src = photoSrc(photo);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setAt(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="photo-wipe" ref={box}>
      <div
        className="photo-wipe-photo"
        style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}
      >
        {src && !missing ? (
          <img
            src={src}
            alt={photo.caption}
            draggable={false}
            onError={() => setMissing(true)}
          />
        ) : (
          <p className="photo-wipe-missing">The photo is not available here.</p>
        )}
        <p className="photo-wipe-credit">
          Photo: {photo.creator}, {photo.license}
        </p>
      </div>
      <div
        className="photo-wipe-handle"
        role="slider"
        tabIndex={0}
        aria-label="Wipe between the photo and our wall"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(at)}
        aria-valuetext={`${Math.round(at)}% photo, ${100 - Math.round(at)}% pattern`}
        style={{ left: `${at}%` }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.stopPropagation();
            move(e.clientX);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && onClose) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
            return;
          }
          if (e.key === 'Home') {
            e.preventDefault();
            e.stopPropagation();
            setAt(0);
            return;
          }
          if (e.key === 'End') {
            e.preventDefault();
            e.stopPropagation();
            setAt(100);
            return;
          }
          const step =
            e.key === 'ArrowLeft' || e.key === 'ArrowDown'
              ? -5
              : e.key === 'ArrowRight' || e.key === 'ArrowUp'
                ? 5
                : e.key === 'PageDown'
                  ? -15
                  : e.key === 'PageUp'
                    ? 15
                    : 0;
          if (!step) return;
          e.preventDefault();
          e.stopPropagation();
          setAt((x) => Math.max(0, Math.min(100, x + step)));
        }}
      >
        <span className="photo-wipe-grip" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
