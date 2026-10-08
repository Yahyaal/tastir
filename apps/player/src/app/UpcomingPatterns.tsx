import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UPCOMING_PATTERNS,
  type UpcomingPattern,
  type UpcomingPhase,
} from './upcoming-patterns';
import { UpcomingIllustration } from './UpcomingIllustrations';

export function UpcomingPatterns() {
  const [selectedFold, setSelectedFold] = useState<number | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<UpcomingPhase | 'all'>('all');
  const [search, setSearch] = useState<string>('');
  const [activeLightbox, setActiveLightbox] = useState<{
    pattern: UpcomingPattern;
    mode: 'photo' | 'drawn' | 'blueprint';
  } | null>(null);

  const folds = useMemo(() => {
    const list = [...new Set(UPCOMING_PATTERNS.map((p) => p.fold))].sort((a, b) => a - b);
    return list;
  }, []);

  const styles = useMemo(() => {
    return [...new Set(UPCOMING_PATTERNS.map((p) => p.style))].sort();
  }, []);

  const phases: UpcomingPhase[] = [
    'Phase 1 · Immediate',
    'Phase 2 · Classical',
    'Phase 3 · Monumental',
  ];

  const filtered = useMemo(() => {
    return UPCOMING_PATTERNS.filter((pattern) => {
      if (selectedFold !== 'all' && pattern.fold !== selectedFold) return false;
      if (selectedStyle !== 'all' && pattern.style !== selectedStyle) return false;
      if (selectedPhase !== 'all' && pattern.phase !== selectedPhase) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = pattern.title.toLowerCase().includes(q);
        const matchArabic = pattern.arabicTitle.includes(q);
        const matchMonument = pattern.monument.toLowerCase().includes(q);
        const matchLocation = pattern.location.toLowerCase().includes(q);
        const matchStyle = pattern.style.toLowerCase().includes(q);
        if (!matchTitle && !matchArabic && !matchMonument && !matchLocation && !matchStyle) {
          return false;
        }
      }
      return true;
    });
  }, [selectedFold, selectedStyle, selectedPhase, search]);

  return (
    <div className="upcoming-page">
      <header className="upcoming-topbar">
        <a className="home" href="#/">
          <span className="back-arrow" aria-hidden="true">←</span>
          <span className="wordmark">
            Tastir <span className="brand-arabic" aria-hidden="true" lang="ar" dir="rtl">تسطير</span>
          </span>
          <span className="library-crumb">All patterns</span>
        </a>
      </header>

      <main className="upcoming-content">
        <header className="upcoming-hero">
          <div className="eyebrow">
            <span>CURATORIAL ROADMAP</span>
            <span className="eyebrow-sep">·</span>
            <span className="eyebrow-arabic" lang="ar" dir="rtl">قائمة الأنماط القادمة</span>
          </div>
          <h1>Upcoming Patterns & Masterwork Queue</h1>
          <p className="upcoming-lead">
            A researched catalog of historic masterworks from across the Islamic world, prepared for
            step-by-step compass and straightedge construction in the Tastir atelier. We are adding
            these in structured batches—starting with missing honeycomb rosettes from Samira Mian and the
            celebrated 10-fold Girih tile systems.
          </p>
        </header>

        <section className="upcoming-controls" aria-label="Filters for upcoming patterns">
          <div className="upcoming-search-row">
            <input
              type="search"
              className="upcoming-search"
              placeholder="Search by monument, city, or pattern name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search upcoming patterns"
            />
            {(selectedFold !== 'all' || selectedStyle !== 'all' || selectedPhase !== 'all' || search) && (
              <button
                type="button"
                className="upcoming-reset-btn"
                onClick={() => {
                  setSelectedFold('all');
                  setSelectedStyle('all');
                  setSelectedPhase('all');
                  setSearch('');
                }}
              >
                Reset filters ✕
              </button>
            )}
          </div>

          <div className="upcoming-filter-groups">
            <fieldset className="upcoming-filter-group">
              <legend>Symmetry fold</legend>
              <button
                type="button"
                className={`upcoming-chip ${selectedFold === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFold('all')}
              >
                All folds
              </button>
              {folds.map((f) => (
                <button
                  type="button"
                  key={f}
                  className={`upcoming-chip ${selectedFold === f ? 'active' : ''}`}
                  onClick={() => setSelectedFold(f)}
                >
                  {f === 10 ? '10-fold (Girih)' : `${f}-fold`}
                </button>
              ))}
            </fieldset>

            <fieldset className="upcoming-filter-group">
              <legend>Tradition</legend>
              <button
                type="button"
                className={`upcoming-chip ${selectedStyle === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedStyle('all')}
              >
                All traditions
              </button>
              {styles.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`upcoming-chip ${selectedStyle === s ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(s)}
                >
                  {s}
                </button>
              ))}
            </fieldset>

            <fieldset className="upcoming-filter-group">
              <legend>Release batch</legend>
              <button
                type="button"
                className={`upcoming-chip ${selectedPhase === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPhase('all')}
              >
                All phases
              </button>
              {phases.map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`upcoming-chip ${selectedPhase === p ? 'active' : ''}`}
                  onClick={() => setSelectedPhase(p)}
                >
                  {p}
                </button>
              ))}
            </fieldset>
          </div>

          <div className="upcoming-metrics">
            <span>
              Showing <strong>{filtered.length}</strong> of{' '}
              <strong>{UPCOMING_PATTERNS.length}</strong> planned masterworks
            </span>
            <span className="metrics-dot">·</span>
            <span>
              Covering <strong>8 geometric traditions</strong> &{' '}
              <strong>5 symmetry families</strong>
            </span>
          </div>
        </section>

        <section className="upcoming-grid-section" aria-label="Catalog of upcoming patterns">
          <ul className="upcoming-grid">
            {filtered.map((pattern) => (
              <UpcomingCard
                key={pattern.id}
                pattern={pattern}
                onOpenLightbox={(mode) => setActiveLightbox({ pattern, mode })}
              />
            ))}
          </ul>
          {filtered.length === 0 && (
            <div className="upcoming-empty">
              <p>No upcoming patterns match your selected filters.</p>
              <button
                type="button"
                className="upcoming-chip active"
                onClick={() => {
                  setSelectedFold('all');
                  setSelectedStyle('all');
                  setSelectedPhase('all');
                  setSearch('');
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </main>

      {activeLightbox && (
        <UpcomingLightbox
          pattern={activeLightbox.pattern}
          mode={activeLightbox.mode}
          onClose={() => setActiveLightbox(null)}
        />
      )}
    </div>
  );
}

function UpcomingCard({
  pattern,
  onOpenLightbox,
}: {
  pattern: UpcomingPattern;
  onOpenLightbox: (mode: 'photo' | 'drawn' | 'blueprint') => void;
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const isPlayable = pattern.status === 'Playable now';

  const defaultMode = pattern.photoUrl
    ? 'photo'
    : pattern.drawnUrl
    ? 'drawn'
    : 'blueprint';
  const [mode, setMode] = useState<'photo' | 'drawn' | 'blueprint'>(defaultMode);

  return (
    <li className={`upcoming-card ${isPlayable ? 'playable-card' : ''}`}>
      <div className="card-top-meta">
        <div className="card-badge-row">
          <span className="card-fold-badge">{pattern.foldLabel}</span>
          <span className="card-phase-badge">{pattern.phase.split(' · ')[0]}</span>
          <span className={`card-status-badge ${isPlayable ? 'playable' : ''}`}>
            {isPlayable ? '✦ Playable now' : pattern.status}
          </span>
        </div>
        <span className="card-arabic-title" lang="ar" dir="rtl">
          {pattern.arabicTitle}
        </span>
      </div>

      {/* Visual Media Section with Photo / Drawn / Blueprint Switcher */}
      <div className="card-visual-section">
        <div className="card-media-tabs" role="tablist">
          {pattern.photoUrl && (
            <button
              type="button"
              className={`media-tab ${mode === 'photo' ? 'active' : ''}`}
              onClick={() => setMode('photo')}
              title="Show authentic historical monument photo"
            >
              📷 Monument Photo
            </button>
          )}
          {pattern.drawnUrl && (
            <button
              type="button"
              className={`media-tab ${mode === 'drawn' ? 'active' : ''}`}
              onClick={() => setMode('drawn')}
              title="Show finished drawn wall rendering"
            >
              🎨 Finished Wall
            </button>
          )}
          <button
            type="button"
            className={`media-tab ${mode === 'blueprint' ? 'active' : ''}`}
            onClick={() => setMode('blueprint')}
            title="Show geometric construction blueprint"
          >
            📐 Blueprint
          </button>
        </div>

        <div className="card-media-viewport">
          {mode === 'photo' && pattern.photoUrl ? (
            <div
              className="card-media-interactive"
              onClick={() => onOpenLightbox('photo')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenLightbox('photo');
              }}
              title="Click to view full-size historical photograph"
            >
              <img
                src={pattern.photoUrl}
                alt={pattern.photoCaption ?? pattern.title}
                className="card-media-img"
                loading="lazy"
              />
              <div className="card-media-hover-bar">
                <span className="hover-zoom-pill">🔍 Click to inspect full size</span>
              </div>
            </div>
          ) : mode === 'drawn' && pattern.drawnUrl ? (
            <div
              className="card-media-interactive"
              onClick={() => onOpenLightbox('drawn')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenLightbox('drawn');
              }}
              title="Click to view full-size finished wall"
            >
              <img
                src={pattern.drawnUrl}
                alt={pattern.drawnCaption ?? pattern.title}
                className="card-media-img"
                loading="lazy"
              />
              <div className="card-media-hover-bar">
                <span className="hover-zoom-pill">🔍 Click to inspect full size</span>
              </div>
            </div>
          ) : (
            <div
              className="card-blueprint-interactive"
              onClick={() => onOpenLightbox('blueprint')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenLightbox('blueprint');
              }}
              title="Click to expand geometric blueprint"
            >
              <UpcomingIllustration pattern={pattern} size={220} />
              <div className="card-media-hover-bar">
                <span className="hover-zoom-pill">📐 Click to expand blueprint</span>
              </div>
            </div>
          )}
        </div>

        <div className="card-visual-footer">
          <span className="visual-badge">
            Symmetry: {pattern.fold}-fold (D<sub>{pattern.fold}</sub>)
          </span>
          <span className="visual-badge">
            {pattern.fold === 6 || pattern.id.includes('hex')
              ? 'Honeycomb (p6m)'
              : pattern.fold === 10
              ? 'Rectangular (cmm)'
              : 'Square (p4m)'}
          </span>
        </div>
      </div>

      <div className="card-main">
        <h2 className="card-title">{pattern.title}</h2>
        <div className="card-provenance">
          <span>{pattern.style}</span>
          <span className="dot">·</span>
          <span>{pattern.period}</span>
          <span className="dot">·</span>
          <span>{pattern.location}</span>
        </div>
        <p className="card-monument">
          <strong>Monument:</strong> {pattern.monument}
        </p>
        <p className="card-medium">
          <strong>Medium:</strong> {pattern.medium}
        </p>
      </div>

      <div className="card-curatorial">
        <p className="card-summary">{pattern.summary}</p>
        <div className="card-construction">
          <span className="construction-label">Construction Archetype:</span>
          <p>{pattern.constructionNotes}</p>
        </div>
      </div>

      {/* Step-by-Step Drawing Instructions Section */}
      <div className="card-drawing-guide">
        <button
          type="button"
          className={`drawing-guide-toggle ${showInstructions ? 'open' : ''}`}
          onClick={() => setShowInstructions((prev) => !prev)}
          aria-expanded={showInstructions}
        >
          <span className="toggle-label">
            <span className="compass-icon">✦</span> How to Draw · Compass & Straightedge (
            {pattern.drawingSteps?.length ?? 4} Steps)
          </span>
          <span className="toggle-indicator">
            {showInstructions ? 'Hide instructions ▴' : 'View instructions ▾'}
          </span>
        </button>

        {showInstructions && pattern.drawingSteps && (
          <ol className="drawing-steps-list">
            {pattern.drawingSteps.map((step) => (
              <li key={step.step} className="drawing-step-card">
                <div className="step-card-header">
                  <span className="step-badge">Step {step.step}</span>
                  <h4 className="step-title">{step.title}</h4>
                </div>
                <p className="step-instruction">{step.instruction}</p>
                <div className="step-geometry-tag">
                  <span className="geo-icon">📐</span>
                  <span className="geo-formula">{step.geometry}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <footer className="card-footer">
        <div className="card-source">
          <span className="source-label">Authentic Reference:</span>
          <span className="source-text">
            {pattern.photoUrl
              ? '📷 Verified monument photograph & geometric reconstruction bundled in Tastir'
              : pattern.source.name}
          </span>
          {pattern.source.citation && (
            <span className="source-citation">{pattern.source.citation}</span>
          )}
          {pattern.source.url && (
            <a
              href={pattern.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
              title="View external academic or museum catalogue citation"
            >
              Catalog reference ↗
            </a>
          )}
        </div>

        {isPlayable && (
          <div className="card-play-actions-group">
            <a href={`#/${pattern.id}`} className="card-play-action-btn primary">
              Play Interactive Tutorial →
            </a>
            <a href={`#/${pattern.id}/result`} className="card-play-action-btn secondary">
              View Tiled Wall →
            </a>
          </div>
        )}
      </footer>
    </li>
  );
}

function UpcomingLightbox({
  pattern,
  mode: initialMode,
  onClose,
}: {
  pattern: UpcomingPattern;
  mode: 'photo' | 'drawn' | 'blueprint';
  onClose: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [actualSize, setActualSize] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasPhoto = Boolean(pattern.photoUrl);
  const hasDrawn = Boolean(pattern.drawnUrl);

  const currentCaption =
    mode === 'photo'
      ? pattern.photoCaption ?? `Historical photograph: ${pattern.monument}`
      : mode === 'drawn'
      ? pattern.drawnCaption ?? `Finished masterwork tiling: ${pattern.title}`
      : `Geometric blueprint: ${pattern.fold}-fold symmetry analysis`;

  const isPlayable = pattern.status === 'Playable now';

  return createPortal(
    <div
      className="upcoming-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspection viewer: ${pattern.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header className="lightbox-header">
        <div className="lightbox-title-area">
          <h3>
            {pattern.title}{' '}
            <span className="arabic-sub" lang="ar" dir="rtl">
              {pattern.arabicTitle}
            </span>
          </h3>
          <p className="lightbox-provenance">
            {pattern.monument} · {pattern.location} ({pattern.period}) · {pattern.medium}
          </p>
        </div>

        <div className="lightbox-controls">
          <div className="lightbox-tabs" role="tablist">
            {hasPhoto && (
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'photo'}
                className={`lightbox-tab ${mode === 'photo' ? 'active' : ''}`}
                onClick={() => setMode('photo')}
              >
                📷 Monument Photo
              </button>
            )}
            {hasDrawn && (
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'drawn'}
                className={`lightbox-tab ${mode === 'drawn' ? 'active' : ''}`}
                onClick={() => setMode('drawn')}
              >
                🎨 Finished Wall
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'blueprint'}
              className={`lightbox-tab ${mode === 'blueprint' ? 'active' : ''}`}
              onClick={() => setMode('blueprint')}
            >
              📐 Blueprint
            </button>
          </div>

          {mode !== 'blueprint' && (
            <button
              type="button"
              className="lightbox-zoom-btn"
              onClick={() => setActualSize(!actualSize)}
              aria-pressed={actualSize}
            >
              {actualSize ? '⤢ Fit to Screen' : '🔍 Actual Resolution'}
            </button>
          )}

          <button
            type="button"
            className="lightbox-close-btn"
            onClick={onClose}
            aria-label="Close inspection view"
          >
            ✕ Close
          </button>
        </div>
      </header>

      <div
        className={`lightbox-stage ${actualSize ? 'actual-size' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {mode === 'photo' && pattern.photoUrl ? (
          <img
            src={pattern.photoUrl}
            alt={currentCaption}
            className="lightbox-img"
            onClick={() => setActualSize(!actualSize)}
          />
        ) : mode === 'drawn' && pattern.drawnUrl ? (
          <img
            src={pattern.drawnUrl}
            alt={currentCaption}
            className="lightbox-img"
            onClick={() => setActualSize(!actualSize)}
          />
        ) : (
          <div className="lightbox-blueprint-wrap">
            <UpcomingIllustration pattern={pattern} size={420} />
          </div>
        )}
      </div>

      <footer className="lightbox-footer">
        <div className="lightbox-footer-info">
          <p className="lightbox-caption">{currentCaption}</p>
          <p className="lightbox-summary">{pattern.summary}</p>
        </div>

        {isPlayable && (
          <div className="lightbox-actions">
            <a href={`#/${pattern.id}`} className="lightbox-play-btn" onClick={onClose}>
              ✦ Play Interactive Tutorial →
            </a>
            <a href={`#/${pattern.id}/result`} className="lightbox-secondary-btn" onClick={onClose}>
              View Tiled Wall
            </a>
          </div>
        )}
      </footer>
    </div>,
    document.body,
  );
}
