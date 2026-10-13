import { useEffect, useState, type MouseEvent } from 'react';
import {
  PATTERNS,
  PROGRESS,
  QUESTIONS,
  type ProgressItem,
  type Pattern,
  type Picture,
  type Question,
} from './data';
import { LIBRARY } from '../app/library';
import './review.css';

const STORE = 'tastir-review-answers';

/** Answers typed on this page, kept in this browser between visits. */
function useAnswers() {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE) ?? '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(answers));
    } catch {
      // Private windows may refuse storage; the page still works.
    }
  }, [answers]);
  const set = (key: string, value: string) =>
    setAnswers((a) => ({ ...a, [key]: value }));
  return { answers, set };
}

/** All answers as plain text, ready to paste back into the chat. */
function answersText(answers: Record<string, string>): string {
  const lines: string[] = ['My review answers:', ''];
  QUESTIONS.forEach((q, i) => {
    const a = answers[q.id]?.trim();
    if (a) lines.push(`Q${i + 1}. ${q.text}`, `A: ${a}`, '');
  });
  const other = answers['other']?.trim();
  if (other) lines.push('Anything else:', other, '');
  return lines.join('\n');
}

/** The cards that are tutorials, so they can open in the player. */
const TUTORIALS = new Set(LIBRARY.map((e) => e.id));

/** Question numbers as shown on the page, by question id. */
const NUMBER = new Map(QUESTIONS.map((q, i) => [q.id, i + 1]));

function QuestionItem({
  question: q,
  answer,
  setAnswer,
}: {
  question: Question;
  answer: string;
  setAnswer: (value: string) => void;
}) {
  const title = PATTERNS.find((p) => p.id === q.card)?.title ?? q.card;
  return (
    <li
      className={answer.trim() ? 'question answered' : 'question'}
      id={`q-${q.id}`}
    >
      <p className="q-text">
        <span className="q-num">Q{NUMBER.get(q.id)}</span> {q.text}
      </p>
      {q.pictures.length ? (
        <div className="figures">
          {q.pictures.map((pic) => (
            <Figure
              key={pic.src}
              picture={pic}
              wide={/designs-|draw-along/.test(pic.src)}
            />
          ))}
        </div>
      ) : null}
      {q.choices?.length ? (
        <div className="choices">
          {q.choices.map((c) => (
            <button
              key={c}
              type="button"
              className={answer === c ? 'chosen' : undefined}
              onClick={() => setAnswer(c)}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        aria-label={`Your answer to Q${NUMBER.get(q.id)}`}
        placeholder="Or type your own answer (saved in this browser)"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <p className="q-more">
        Details: <a href={`#${q.card}`}>{title}</a>
      </p>
    </li>
  );
}

function Item({ item }: { item: ProgressItem }) {
  return (
    <li>
      <strong>{item.title}.</strong> {item.text}
      {item.link ? (
        <>
          {' '}
          <a
            href={item.link.href}
            {...(item.link.href.startsWith('/#/')
              ? { target: '_blank', rel: 'noreferrer' }
              : {})}
          >
            {item.link.label}
            {item.link.href.startsWith('/#/') ? ' ↗' : ''}
          </a>
        </>
      ) : null}
    </li>
  );
}

/** Where the work stands: done, doing now, next, and waiting on the owner. */
function Progress() {
  return (
    <section className="progress" id="progress">
      <h2 className="group">Progress</h2>
      <p className="group-note">
        Updated {PROGRESS.updated}. The goal: {PROGRESS.goal}
      </p>
      <div className="progress-now">
        <h3>Working on now</h3>
        <ul>
          <Item item={PROGRESS.now} />
        </ul>
      </div>
      <h3>Done recently</h3>
      <ul className="progress-done">
        {PROGRESS.done.map((item) => (
          <Item key={item.title} item={item} />
        ))}
      </ul>
      <h3>Still to do, in this order</h3>
      <ol className="progress-next">
        {PROGRESS.next.map((item) => (
          <Item key={item.title} item={item} />
        ))}
      </ol>
      <h3>Waiting on you</h3>
      <ul className="progress-waiting">
        {PROGRESS.waiting.map((item) => (
          <Item key={item.title} item={item} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Links to a card or question on this page (#design-h1, #q-x) scroll to it.
 * The app routes by the address's #, so following them would leave the page.
 */
function jumpWithinPage(e: MouseEvent<HTMLDivElement>) {
  const href = (e.target as Element).closest('a')?.getAttribute('href');
  if (!href?.startsWith('#') || href.startsWith('#/')) return;
  e.preventDefault();
  document
    .getElementById(href.slice(1))
    ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
}

const url = (p: Picture) => `/__review/${p.src}`;

/** Side-by-side comparisons need the card's full width to be legible. */
const isWide = (p: Picture) => /compare|overlay\.png/.test(p.src);

function Figure({ picture, wide }: { picture: Picture; wide?: boolean }) {
  return (
    <figure className={wide || isWide(picture) ? 'wide' : undefined}>
      <a href={url(picture)} target="_blank" rel="noreferrer">
        <img src={url(picture)} alt={picture.caption} loading="lazy" />
      </a>
      <figcaption>{picture.caption}</figcaption>
    </figure>
  );
}

function Card({ pattern: p }: { pattern: Pattern }) {
  const decide = p.status === 'decide';
  return (
    <article className={`review-card ${p.status}`} id={p.id}>
      <header>
        <span className={`badge ${p.status}`}>
          {decide
            ? 'Needs your decision'
            : p.status === 'decided'
              ? 'Decided'
              : 'Verified'}
        </span>
        <h3>{p.title}</h3>
        <span className="fold">{p.fold}-fold</span>
      </header>
      <p className="summary">{p.summary}</p>
      {TUTORIALS.has(p.id) ? (
        <p className="open">
          <a href={`/#/${p.id}`} target="_blank" rel="noreferrer">
            Open it in the player ↗
          </a>{' '}
          <span className="hint">
            (step through it, then go on to the wall)
          </span>
        </p>
      ) : null}
      {p.story.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      <div className="figures">
        {p.pictures.map((pic) => (
          <Figure key={pic.src} picture={pic} />
        ))}
      </div>
      {p.decision ? (
        <section className="asks decided">
          <h4>Decision</h4>
          <p>{p.decision}</p>
        </section>
      ) : null}
      {QUESTIONS.some((q) => q.card === p.id || q.also?.includes(p.id)) ? (
        <section className="asks">
          <h4>My questions about this pattern</h4>
          <p>
            {QUESTIONS.filter(
              (q) => q.card === p.id || q.also?.includes(p.id),
            ).map((q, i) => (
              <span key={q.id}>
                {i ? ' · ' : ''}
                <a href={`#q-${q.id}`}>
                  Q{NUMBER.get(q.id)}: {q.text.split(/[.:?]/)[0]}
                </a>
              </span>
            ))}
          </p>
        </section>
      ) : p.asks.length ? (
        <section className="asks">
          <h4>What to look at</h4>
          <ul>
            {p.asks.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="sources">
        <h4>Sources</h4>
        <ul>
          {p.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

/**
 * The overnight review: what was made, what needs the owner's decision,
 * and how to check it. Dev server only, because its pictures come from
 * the private docs/research folder.
 */
export function Review() {
  const { answers, set } = useAnswers();
  const [copied, setCopied] = useState(false);
  const decide = PATTERNS.filter((p) => p.status !== 'verified');
  const verified = PATTERNS.filter((p) => p.status === 'verified');
  const copy = async () => {
    await navigator.clipboard?.writeText(answersText(answers));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="review" onClick={jumpWithinPage}>
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/notes">Project notes</a> ·{' '}
          <a href="#/plan">Plan: your own patterns</a> ·{' '}
          <a href="#/plan/draw-along">Plan: draw along</a> ·{' '}
          <a href="#/plan/colors">Colours</a>{' '}
          <a href="#/plan/colour-stage">Your colours</a>
        </span>
        <button type="button" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy my answers'}
        </button>
      </nav>

      <header className="review-head">
        <h1>Review</h1>
        <p className="lede">
          {QUESTIONS.length} questions for you, most important first. Each has a
          picture where the designs are named with letters (Design A, B…) and
          the parts I mean are marked in colour. Click a choice or type your own
          answer; answers are saved in this browser. When you are done, press{' '}
          <strong>Copy my answers</strong> at the top and paste the text into
          our chat.
        </p>
      </header>

      <h2 className="group" id="questions">
        Questions for you
      </h2>
      {QUESTIONS.length === 0 ? (
        <p className="group-note">
          No questions for you right now. Your decisions are on the cards below,
          marked Decided.
        </p>
      ) : null}
      <ol className="questions">
        {QUESTIONS.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            answer={answers[q.id] ?? ''}
            setAnswer={(v) => set(q.id, v)}
          />
        ))}
      </ol>

      <Progress />

      <h2 className="group" id="background">
        Background
      </h2>
      <p className="group-note">
        On the night of 3–4 October I added pattern tutorials to Tastir. Nothing
        was deleted: every pattern below is in the library and you can play it.
        Jump to: <a href="#decide-list">patterns waiting for you</a> ·{' '}
        <a href="#verified-list">verified patterns</a> ·{' '}
        <a href="#other">other things from the night</a>
      </p>
      <details className="glossary">
        <summary>Words I use on this page</summary>
        <dl>
          <dt>Construction</dt>
          <dd>
            The compass circles and ruler lines the learner draws, step by step.
            In the pictures they are grey.
          </dd>
          <dt>Ink</dt>
          <dd>
            The lines chosen from the construction to form the pattern. In the
            pictures they are black, or red when laid over a source drawing.
          </dd>
          <dt>Tile</dt>
          <dd>The square or hexagon of pattern that repeats.</dd>
          <dt>Wall</dt>
          <dd>
            The tile repeated edge to edge, coloured by piece, as in the
            player’s last stage.
          </dd>
          <dt>Piece</dt>
          <dd>
            One closed shape between ink lines, as a tile cutter would cut it.
          </dd>
          <dt>Six-fold, eight-fold…</dt>
          <dd>
            How many times the pattern repeats around its centre: six-fold looks
            the same after turning it by 60°.
          </dd>
          <dt>Verified</dt>
          <dd>
            The wall matches a photo of the pattern on a real building or
            object, not just the tutorial I learned it from.
          </dd>
        </dl>
      </details>

      <h2 className="group" id="decide-list">
        Patterns waiting for you ({decide.length})
      </h2>
      {decide.map((p) => (
        <Card key={p.id} pattern={p} />
      ))}

      <h2 className="group" id="verified-list">
        Verified ({verified.length})
      </h2>
      <p className="group-note">
        These match photos of the real pattern. A quick look in the player is
        all they need.
      </p>
      {verified.map((p) => (
        <Card key={p.id} pattern={p} />
      ))}

      <h2 className="group" id="other">
        Other things from the night
      </h2>
      <article className="review-card other">
        <h3>Check the wall by eye</h3>
        <p>
          The player’s wall can now repeat hexagonal tiles. To check it, open{' '}
          <a
            href="/#/six-fold-star-and-hexagons"
            target="_blank"
            rel="noreferrer"
          >
            Star and hexagons ↗
          </a>
          , go through to the wall and zoom in and out. You should see
          six-pointed stars each ringed by six hexagons, the grout lines all the
          same width, and no gaps or seams where the tiles meet.
        </p>

        <h3>New tools for making tutorials</h3>
        <p>
          <code>pnpm review &lt;id&gt;</code> draws every step of a tutorial,
          its ink, one tile and the wall as pictures in{' '}
          <code>docs/review/&lt;id&gt;/</code> (the pictures on this page come
          from there).{' '}
          <code>pnpm compare &lt;id&gt; &lt;step&gt; &lt;picture&gt;</code> puts
          a source picture beside our drawing of the same step. The tests now
          also check that every tutorial builds step by step and only inks lines
          it actually drew.
        </p>

        <h3>Everything is on a branch</h3>
        <p>
          All the work is on the <code>overnight</code> branch, one commit per
          tool or tutorial, and not merged into <code>main</code>. When you are
          happy, run{' '}
          <code>git checkout main &amp;&amp; git merge overnight</code>. Tests,
          lint and typecheck all pass on the branch.
        </p>

        <h3>Leftover folders to delete</h3>
        <p>
          I started four helper agents early in the night; all four stopped on a
          usage limit before producing anything. Their working copies are still
          in <code>.claude/worktrees/</code> (I was not allowed to remove them).
          They do no harm, but you can delete them with:
        </p>
        <pre>
          {
            'git worktree list\ngit worktree remove --force .claude/worktrees/<name>   # for each one listed\ngit branch -D worktree-agent-<id>                        # their branches'
          }
        </pre>

        <h3>Connectors</h3>
        <p>
          The Gmail and Google Calendar connectors need authorising in your
          claude.ai connector settings, and the Claude Design server failed to
          connect. None of them were needed tonight.
        </p>

        <h3>Anything else you want to tell me</h3>
        <textarea
          aria-label="Anything else"
          placeholder="Anything else (included when you copy your answers)"
          value={answers['other'] ?? ''}
          onChange={(e) => set('other', e.target.value)}
        />
      </article>
    </div>
  );
}
