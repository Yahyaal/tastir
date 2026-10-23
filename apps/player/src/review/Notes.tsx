import { Markdown } from './markdown';
import './review.css';

// The documents, read as text from docs/ when the app is built.
const files = import.meta.glob<string>(
  [
    '../../../../docs/*.md',
    '../../../../docs/patterns/*.md',
    '../../../../docs/testing/studio-chatgpt-2026-10-21.md',
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
    key: 'start',
    label: 'Start here',
    file: 'PROJECT.md',
    text: read('PROJECT.md'),
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
