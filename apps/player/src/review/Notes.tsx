import { BeginnerPath } from './BeginnerPath';
import { ReliabilityUpdate } from './ReliabilityUpdate';
import { SettingsReview } from './SettingsReview';
import { TeachingUpdate } from './TeachingUpdate';
import { InkPresentation } from './InkPresentation';
import { LinesStudy } from './LinesStudy';
import { Markdown } from './markdown';
import './review.css';

// The documents, read as text from docs/ when the app is built.
const files = import.meta.glob<string>(
  [
    '../../../../docs/*.md',
    '../../../../docs/patterns/*.md',
    '../../../../docs/testing/grok-*.md',
    '../../../../docs/testing/studio-chatgpt-2026-10-21.md',
    '../../../../docs/testing/codex-provenance-review-2026-10-23.md',
    '../../../../docs/testing/ink-overlay-2026-11-14.md',
    '../../../../docs/testing/teaching-followup-2026-11-15.md',
    '../../../../docs/testing/guide-settings-sharing-2026-11-15.md',
    '../../../../docs/testing/review-duplicates-2026-11-14.md',
    '../../../../docs/prompts/review-handover-2026-11-14.md',
  ],
  { query: '?raw', import: 'default', eager: true },
);
const read = (file: string) => files[`../../../../docs/${file}`] ?? '';

/**
 * The project notes (#/notes): the documents a new session reads first,
 * shown as they are in docs/, so the owner and Claude read the same text.
 */
export const DOCS: readonly {
  key: string;
  label: string;
  file: string;
  text: string;
}[] = [
  {
    key: 'print-pieces',
    label: 'Printing tile pieces on the A1',
    file: 'PRINT-PIECES.md',
    text: read('PRINT-PIECES.md'),
  },
  {
    key: '3d-plan',
    label: 'Make it in 3D: plan',
    file: '3D-PLAN.md',
    text: read('3D-PLAN.md'),
  },
  {
    key: 'beginner-path-proposal',
    label: 'Beginner path: selection and evidence',
    file: 'BEGINNER-PATH-PROPOSAL-2026-11-16.md',
    text: read('BEGINNER-PATH-PROPOSAL-2026-11-16.md'),
  },
  {
    key: 'morning-report-17',
    label: 'Morning report: 17 November',
    file: 'NIGHT-REPORT-2026-11-17.md',
    text: read('NIGHT-REPORT-2026-11-17.md'),
  },
  {
    key: 'morning-report',
    label: 'Morning report: 16 November',
    file: 'NIGHT-REPORT-2026-11-16.md',
    text: read('NIGHT-REPORT-2026-11-16.md'),
  },
  ...[
    [
      'grok-auth-evidence',
      'Signed-out retry evidence',
      'testing/grok-auth-2026-11-15.md',
    ],
    [
      'grok-files-evidence',
      'Editable-file evidence',
      'testing/grok-files-2026-11-15.md',
    ],
    [
      'grok-library-evidence',
      'Collection and Arabic search evidence',
      'testing/grok-library-2026-11-15.md',
    ],
    [
      'grok-audit-evidence',
      'Accessibility and delivery measurements',
      'testing/grok-accessibility-2026-11-15.md',
    ],
    [
      'grok-navigation-evidence',
      'Step-link and history evidence',
      'testing/grok-navigation-2026-11-16.md',
    ],
    [
      'grok-teaching-evidence',
      'Draw-along teaching evidence',
      'testing/grok-draw-teaching-2026-11-16.md',
    ],
    [
      'grok-usability-evidence',
      'Copy, preview and loading evidence',
      'testing/grok-usability-2026-11-16.md',
    ],
  ].map(([key, label, file]) => ({
    key: key!,
    label: label!,
    file: file!,
    text: read(file!),
  })),
  {
    key: 'palette-engine',
    label: 'Overnight: the palette engine',
    file: 'PALETTE-ENGINE.md',
    text: read('PALETTE-ENGINE.md'),
  },
  {
    key: 'redesign-plan-2026-11-22',
    label: 'Redesign plan: windows on a route',
    file: 'REDESIGN-PLAN-2026-11-22.md',
    text: read('REDESIGN-PLAN-2026-11-22.md'),
  },
  {
    key: 'grok-review',
    label: 'Grok review: priorities and verification',
    file: 'GROK-REVIEW-2026-11-15.md',
    text: read('GROK-REVIEW-2026-11-15.md'),
  },
  {
    key: 'start',
    label: 'Start here',
    file: 'PROJECT.md',
    text: read('PROJECT.md'),
  },
  {
    key: 'status-archive',
    label: 'Archived project status (15 November)',
    file: 'HISTORY-STATE-2026-11-15.md',
    text: read('HISTORY-STATE-2026-11-15.md'),
  },
  {
    key: 'next-steps',
    label: 'Next steps (14 November)',
    file: 'NEXT-STEPS-2026-11-14.md',
    text: read('NEXT-STEPS-2026-11-14.md'),
  },
  {
    key: 'settings-evidence',
    label: 'Guide, settings and sharing evidence',
    file: 'testing/guide-settings-sharing-2026-11-15.md',
    text: read('testing/guide-settings-sharing-2026-11-15.md'),
  },
  {
    key: 'teaching-evidence',
    label: 'Teaching follow-up evidence',
    file: 'testing/teaching-followup-2026-11-15.md',
    text: read('testing/teaching-followup-2026-11-15.md'),
  },
  {
    key: 'ink-overlay',
    label: 'Ink overlay (14 November)',
    file: 'testing/ink-overlay-2026-11-14.md',
    text: read('testing/ink-overlay-2026-11-14.md'),
  },
  {
    key: 'duplicates-review',
    label: 'Duplicates review (14 November)',
    file: 'testing/review-duplicates-2026-11-14.md',
    text: read('testing/review-duplicates-2026-11-14.md'),
  },
  {
    key: 'night-report',
    label: 'Report: night of 14 November',
    file: 'NIGHT-REPORT-2026-11-14.md',
    text: read('NIGHT-REPORT-2026-11-14.md'),
  },
  {
    key: 'handover',
    label: 'Prompt: review handover, 14 November',
    file: 'prompts/review-handover-2026-11-14.md',
    text: read('prompts/review-handover-2026-11-14.md'),
  },
  {
    key: 'library-browsing',
    label: 'Plan: browsing the library',
    file: 'LIBRARY-BROWSING-PLAN.md',
    text: read('LIBRARY-BROWSING-PLAN.md'),
  },
  {
    key: 'feedback',
    label: 'Plan: pattern feedback',
    file: 'FEEDBACK-PLAN.md',
    text: read('FEEDBACK-PLAN.md'),
  },
  {
    key: 'feedback-go-live',
    label: 'Turn on feedback: your remaining steps',
    file: 'FEEDBACK-GO-LIVE.md',
    text: read('FEEDBACK-GO-LIVE.md'),
  },
  {
    key: 'feedback-setup',
    label: 'Feedback setup and review',
    file: 'FEEDBACK-SETUP.md',
    text: read('FEEDBACK-SETUP.md'),
  },
  {
    key: 'regions',
    label: 'Proposed regions',
    file: 'patterns/REGIONS.md',
    text: read('patterns/REGIONS.md'),
  },
  {
    key: 'remaining',
    label: 'Patterns still to build',
    file: 'patterns/REMAINING.md',
    text: read('patterns/REMAINING.md'),
  },
  {
    key: 'yours',
    label: 'Your own patterns',
    file: 'USER-PATTERNS.md',
    text: read('USER-PATTERNS.md'),
  },
  {
    key: 'agent',
    label: 'AI agent plan',
    file: 'AI-AGENT-PLAN.md',
    text: read('AI-AGENT-PLAN.md'),
  },
  {
    key: 'agent-setup',
    label: 'AI agent setup',
    file: 'AI-AGENT-SETUP.md',
    text: read('AI-AGENT-SETUP.md'),
  },
  {
    key: 'agent-review',
    label: 'AI agent review',
    file: 'AI-AGENT-REVIEW.md',
    text: read('AI-AGENT-REVIEW.md'),
  },
  {
    key: 'studio',
    label: 'Studio plan',
    file: 'STUDIO-PLAN.md',
    text: read('STUDIO-PLAN.md'),
  },
  {
    key: 'studio-setup',
    label: 'Studio setup',
    file: 'STUDIO-SETUP.md',
    text: read('STUDIO-SETUP.md'),
  },
  {
    key: 'studio-hosted',
    label: 'Hosted studio',
    file: 'STUDIO-HOSTED-PRD.md',
    text: read('STUDIO-HOSTED-PRD.md'),
  },
  {
    key: 'studio-deploy',
    label: 'Put the studio online',
    file: 'STUDIO-DEPLOY.md',
    text: read('STUDIO-DEPLOY.md'),
  },
  {
    key: 'chatgpt-hosted',
    label: 'ChatGPT hosted sign-in',
    file: 'CHATGPT-HOSTED-SIGN-IN.md',
    text: read('CHATGPT-HOSTED-SIGN-IN.md'),
  },
  {
    key: 'studio-connect',
    label: 'Connect your other apps',
    file: 'STUDIO-CONNECT.md',
    text: read('STUDIO-CONNECT.md'),
  },
  {
    key: 'studio-log',
    label: 'Studio log',
    file: 'STUDIO-LOG.md',
    text: read('STUDIO-LOG.md'),
  },
  {
    key: 'studio-lessons',
    label: 'Studio issues and lessons',
    file: 'testing/studio-chatgpt-2026-10-21.md',
    text: read('testing/studio-chatgpt-2026-10-21.md'),
  },
  {
    key: 'working',
    label: 'Working together',
    file: 'WORKING-WITH-OWNER.md',
    text: read('WORKING-WITH-OWNER.md'),
  },
  {
    key: 'queue',
    label: 'Work queue',
    file: 'patterns/QUEUE.md',
    text: read('patterns/QUEUE.md'),
  },
  {
    key: 'construction-sources',
    label: 'Pattern construction sources',
    file: 'patterns/CONSTRUCTION-AUDIT.md',
    text: read('patterns/CONSTRUCTION-AUDIT.md'),
  },
  {
    key: 'tilingsearch-45',
    label: 'Tiling Search 45° tilings',
    file: 'patterns/TILINGSEARCH-45.md',
    text: read('patterns/TILINGSEARCH-45.md'),
  },
  {
    key: 'status',
    label: 'Pattern status',
    file: 'patterns/STATUS.md',
    text: read('patterns/STATUS.md'),
  },
  {
    key: 'lessons',
    label: 'Lessons',
    file: 'patterns/LESSONS.md',
    text: read('patterns/LESSONS.md'),
  },
  {
    key: 'geometry',
    label: 'Geometry notes',
    file: 'geometry-notes.md',
    text: read('geometry-notes.md'),
  },
  {
    key: 'codex-provenance-review',
    label: 'Review: construction sources',
    file: 'testing/codex-provenance-review-2026-10-23.md',
    text: read('testing/codex-provenance-review-2026-10-23.md'),
  },
  {
    key: 'writing',
    label: 'Writing the steps',
    file: 'tutorial-writing.md',
    text: read('tutorial-writing.md'),
  },
  {
    key: 'method',
    label: 'How to add a pattern',
    file: 'patterns/BRIEF.md',
    text: read('patterns/BRIEF.md'),
  },
];

/** A link inside a document: another shown document opens here. */
function linkFrom(file: string) {
  const dir = file.includes('/')
    ? file.slice(0, file.lastIndexOf('/') + 1)
    : '';
  return (href: string) => {
    if (/^(https?:|#)/.test(href)) return href;
    const parts = (dir + href).split('/');
    const path: string[] = [];
    for (const p of parts) {
      if (p === '..') path.pop();
      else if (p !== '.') path.push(p);
    }
    const doc = DOCS.find((d) => d.file === path.join('/'));
    return doc ? `#/notes/${doc.key}` : href;
  };
}

export function Notes({ page = 'start' }: { page?: string }) {
  if (page === 'beginner-path') return <BeginnerPath />;
  if (page === 'lines-study') return <LinesStudy />;
  if (page === 'reliability-update') return <ReliabilityUpdate />;
  if (page === 'settings-designs') return <SettingsReview />;
  if (page === 'settings-update') return <SettingsReview />;
  if (page === 'ink-guide')
    return <TeachingUpdate key={page} initialTopic="preview" />;
  if (page === 'teaching-update') return <TeachingUpdate key={page} />;
  if (page === 'ink-presentation') return <InkPresentation />;
  const doc = DOCS.find((d) => d.key === page) ?? DOCS[0];
  if (!doc) return null;
  return (
    <div className="review notes">
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/plan">Plan: your own patterns</a> ·{' '}
          <a href="#/review">Review page →</a>
        </span>
      </nav>
      <header className="review-head">
        <h1>Project notes</h1>
        <p className="lede">
          What we are building, where it stands, what comes next, and what we
          have learned. These are the files in <code>docs/</code> that every new
          Claude Code session reads first.
        </p>
      </header>
      <p>
        <a href="#/review/route">
          New: the route from Córdoba to Agra, in light and dark →
        </a>
      </p>
      <p>
        <a href="#/notes/palette-engine">
          New: the palette engine, the overnight report →
        </a>
      </p>
      <p>
        <a href="#/review/windows">
          The window cards, every arch in light and dark →
        </a>
      </p>
      <p>
        <a href="#/notes/redesign-plan-2026-11-22">
          The plan to build the redesign →
        </a>
      </p>
      <p>
        <a href="#/notes/teaching-update">
          New: construction research and fixes
        </a>{' '}
        · <a href="#/plan/palettes">Palette study</a> ·{' '}
        <a href="#/notes/ink-presentation">
          Ink comparison: the visual research presentation →
        </a>
      </p>
      <nav className="notes-tabs" aria-label="Documents">
        {DOCS.map((d) => (
          <a
            key={d.key}
            href={`#/notes/${d.key}`}
            className={d.key === doc.key ? 'current' : undefined}
            aria-current={d.key === doc.key ? 'page' : undefined}
          >
            {d.label}
          </a>
        ))}
      </nav>
      <article className="notes-doc">
        <p className="notes-file">
          <code>docs/{doc.file}</code>
        </p>
        <Markdown text={doc.text} link={linkFrom(doc.file)} />
      </article>
    </div>
  );
}
