import { useState, useMemo } from 'react';
import {
  UPCOMING_PATTERNS,
  type UpcomingPattern,
  type UpcomingPhase,
} from './upcoming-patterns';

export function UpcomingPatterns() {
  const [selectedFold, setSelectedFold] = useState<number | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<UpcomingPhase | 'all'>('all');
  const [search, setSearch] = useState<string>('');

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
              <UpcomingCard key={pattern.id} pattern={pattern} />
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
    </div>
  );
}

function UpcomingCard({ pattern }: { pattern: UpcomingPattern }) {
  return (
    <li className="upcoming-card">
      <div className="card-top-meta">
        <div className="card-badge-row">
          <span className="card-fold-badge">{pattern.foldLabel}</span>
          <span className="card-phase-badge">{pattern.phase.split(' · ')[0]}</span>
          <span className="card-status-badge">{pattern.status}</span>
        </div>
        <span className="card-arabic-title" lang="ar" dir="rtl">
          {pattern.arabicTitle}
        </span>
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

      <footer className="card-footer">
        <div className="card-source">
          <span className="source-label">Source / Reference:</span>
          {pattern.source.url ? (
            <a
              href={pattern.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              {pattern.source.name} ↗
            </a>
          ) : (
            <span className="source-text">{pattern.source.name}</span>
          )}
          {pattern.source.citation && (
            <span className="source-citation">{pattern.source.citation}</span>
          )}
        </div>
      </footer>
    </li>
  );
}
